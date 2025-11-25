import { useEffect } from "react";

const useTextReplacer = () => {
    useEffect(() => {
        const monthMap = {
            'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
            'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12,
            'January': 1, 'February': 2, 'March': 3, 'April': 4, 'June': 6,
            'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12,
        };

        const formatDateToVietnamese = (dateString) => {
            if (!dateString) return '';
            
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            
            const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
            
            const dayOfWeek = daysOfWeek[date.getDay()];
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            
            return `${dayOfWeek}, ${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
        };

        const translations = [
            { selector: 'a.nav-link[href*="/dates"]', replacements: { 'ngày': "Ngày" } },
            { selector: 'a.pgn__dropdown-item.dropdown-item', replacements: { 'Specific Student...': "Học sinh cụ thể..." } },
            { selector: 'button#masquerade-widget-toggle', replacements: { 'Specific Student...': "Học sinh cụ thể..." } },
            { selector: 'a.nav-item.flex-shrink-0.nav-link', replacements: { 'Tiến triển': "Tiến độ" } },
            { selector: 'a.pgn__dropdown-item.dropdown-item', replacements: { 'Staff': "Nhân viên" } },
            { selector: 'button#masquerade-widget-toggle', replacements: { 'Staff': "Nhân viên" } },
        ];

        const replaceTexts = () => {
            translations.forEach(({ selector, replacements }) => {
                const elements = document.querySelectorAll(selector);
                elements.forEach((el) => {
                    Object.entries(replacements).forEach(([vi, en]) => {
                        if (el.textContent.trim() === vi) {
                            el.textContent = en;
                        }
                    });
                });
            });
        };

        // ============ COURSE DATES - ƯU TIÊN CAO NHẤT ============
        const replaceCourseDates = (rootNode = document.body) => {
            const walker = document.createTreeWalker(
                rootNode,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        const parent = node.parentElement;
                        if (!parent || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
                            return NodeFilter.FILTER_REJECT;
                        }
                        
                        const text = node.textContent;
                        
                        // BỎ QUA nếu đã dịch hoàn toàn
                        if (text.includes('sẽ bắt đầu từ ngày') || text.includes('từ ngày') && /\d{2}\/\d{2}\/\d{4}/.test(text)) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        
                        // CHỈ XỬ LÝ nếu có pattern cần dịch
                        if (text.includes('in') && text.includes('days') && text.includes('vào ngày')) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        
                        return NodeFilter.FILTER_REJECT;
                    }
                }
            );

            const textNodes = [];
            let currentNode;
            while (currentNode = walker.nextNode()) {
                textNodes.push(currentNode);
            }

            textNodes.forEach(textNode => {
                let text = textNode.textContent;
                let modified = false;

                // Pattern: "Khóa học bắt đầu in 1,498 days vào ngày Jan 1, 2030"
                // QUAN TRỌNG: Dùng [\d,]+ để bắt số có dấu phẩy
                const pattern = /(Khóa học bắt đầu\s+)?in\s+([\d,]+)\s+days?\s+vào ngày\s+(\w+)\s+(\d{1,2}),\s+(\d{4})/gi;
                
                const matches = [...text.matchAll(pattern)];
                if (matches.length > 0) {
                    matches.forEach(match => {
                        const [fullMatch, prefix, days, month, day, year] = match;
                        const monthNum = monthMap[month] || month;
                        const dateStr = `${day.padStart(2, '0')}/${monthNum.toString().padStart(2, '0')}/${year}`;
                        const cleanDays = days.replace(/,/g, '.');
                        
                        const replacement = prefix 
                            ? `Khóa học sẽ bắt đầu từ ngày ${dateStr} (sau ${cleanDays} ngày)`
                            : `từ ngày ${dateStr} (sau ${cleanDays} ngày)`;
                        
                        text = text.replace(fullMatch, replacement);
                        modified = true;
                    });
                }

                if (modified) {
                    textNode.textContent = text;
                }
            });
        };

        // ============ DATE FORMATS ============
        const replaceDates = (rootNode = document.body) => {
            const walker = document.createTreeWalker(
                rootNode,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        const parent = node.parentElement;
                        if (!parent || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
                            return NodeFilter.FILTER_REJECT;
                        }
                        
                        const text = node.textContent;
                        
                        // BỎ QUA nếu đã có format tiếng Việt HOÀN CHỈNH
                        if (/(Thứ (Hai|Ba|Tư|Năm|Sáu|Bảy)|Chủ Nhật),\s+\d{2}\/\d{2}\/\d{4}/.test(text)) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        
                        // CHỈ XỬ LÝ nếu có English date pattern
                        if (/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/.test(text) ||
                            /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/.test(text) ||
                            /\d{4}-\d{2}-\d{2}/.test(text)) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        
                        return NodeFilter.FILTER_REJECT;
                    }
                }
            );

            const textNodes = [];
            let currentNode;
            while (currentNode = walker.nextNode()) {
                textNodes.push(currentNode);
            }

            textNodes.forEach(textNode => {
                let text = textNode.textContent;
                let modified = false;

                // Pattern 1: "Mon, Nov 24, 2025" hoặc "Monday, November 24, 2025"
                const pattern1 = /\b(Mon|Monday|Tue|Tuesday|Wed|Wednesday|Thu|Thursday|Fri|Friday|Sat|Saturday|Sun|Sunday),?\s+(Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|September|Oct|October|Nov|November|Dec|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi;
                
                const matches1 = [...text.matchAll(pattern1)];
                if (matches1.length > 0) {
                    matches1.forEach(match => {
                        const formatted = formatDateToVietnamese(match[0]);
                        text = text.replace(match[0], formatted);
                        modified = true;
                    });
                }

                // Pattern 2: "2025-11-24" (ISO format)
                const pattern2 = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g;
                const matches2 = [...text.matchAll(pattern2)];
                if (matches2.length > 0) {
                    matches2.forEach(match => {
                        const [fullMatch, year, month, day] = match;
                        const m = parseInt(month);
                        const d = parseInt(day);
                        
                        if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
                            const formatted = formatDateToVietnamese(fullMatch);
                            text = text.replace(fullMatch, formatted);
                            modified = true;
                        }
                    });
                }

                // Pattern 3: Standalone months
                const monthReplacements = {
                    'January': 'Tháng 1', 'February': 'Tháng 2', 'March': 'Tháng 3',
                    'April': 'Tháng 4', 'May': 'Tháng 5', 'June': 'Tháng 6',
                    'July': 'Tháng 7', 'August': 'Tháng 8', 'September': 'Tháng 9',
                    'October': 'Tháng 10', 'November': 'Tháng 11', 'December': 'Tháng 12',
                    'Jan': 'Th1', 'Feb': 'Th2', 'Mar': 'Th3', 'Apr': 'Th4',
                    'Jun': 'Th6', 'Jul': 'Th7', 'Aug': 'Th8', 'Sep': 'Th9',
                    'Oct': 'Th10', 'Nov': 'Th11', 'Dec': 'Th12'
                };

                Object.entries(monthReplacements).forEach(([eng, viet]) => {
                    const regex = new RegExp(`\\b${eng}\\b(?!\\s*\\d)`, 'g');
                    if (regex.test(text)) {
                        text = text.replace(regex, viet);
                        modified = true;
                    }
                });

                if (modified) {
                    textNode.textContent = text;
                }
            });
        };

        const replaceAll = () => {
            replaceTexts();
            replaceCourseDates(); // ƯU TIÊN CAO NHẤT
            replaceDates();
        };

        // Initial run với timeout dài hơn
        let hasRun = false;
        const timeouts = [0, 300, 800, 1500, 3000].map((delay) => 
            setTimeout(() => {
                replaceAll();
                if (delay === 3000) hasRun = true;
            }, delay)
        );

        // Observer - CHỈ CHẠY sau khi initial run xong
        let observerTimeout;
        const observer = new MutationObserver((mutations) => {
            if (!hasRun) return; // Đợi initial run xong
            
            clearTimeout(observerTimeout);
            observerTimeout = setTimeout(() => {
                replaceTexts();
                
                // Chỉ process các node MỚI THÊM VÀO
                const addedNodes = new Set();
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            addedNodes.add(node);
                        }
                    });
                });
                
                addedNodes.forEach(node => {
                    replaceCourseDates(node);
                    replaceDates(node);
                });
            }, 200);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        return () => {
            timeouts.forEach(clearTimeout);
            clearTimeout(observerTimeout);
            observer.disconnect();
        };
    }, []);
};

export const TextReplacerProvider = ({ children }) => {
    useTextReplacer();
    return children;
};