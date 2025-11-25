import { useEffect } from "react";

const useTextReplacer = () => {
    useEffect(() => {
        // Đánh dấu đã xử lý để tránh xử lý lại
        const PROCESSED_ATTR = 'data-date-processed';
        
        // Map tháng
        const monthMap = {
            'Th1': 1, 'Th2': 2, 'Th3': 3, 'Th4': 4, 'Th5': 5, 'Th6': 6,
            'Th7': 7, 'Th8': 8, 'Th9': 9, 'Th10': 10, 'Th11': 11, 'Th12': 12,
            'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
            'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12,
            'January': 1, 'February': 2, 'March': 3, 'April': 4, 'June': 6,
            'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12,
            'Tháng 1': 1, 'Tháng 2': 2, 'Tháng 3': 3, 'Tháng 4': 4, 
            'Tháng 5': 5, 'Tháng 6': 6, 'Tháng 7': 7, 'Tháng 8': 8,
            'Tháng 9': 9, 'Tháng 10': 10, 'Tháng 11': 11, 'Tháng 12': 12
        };

        const formatDateToVietnamese = (dateString) => {
            if (!dateString) return '';
            
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            
            const daysOfWeek = [
                'Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư',
                'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'
            ];
            
            const dayOfWeek = daysOfWeek[date.getDay()];
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            
            return `${dayOfWeek}, ${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
        };

        const translations = [
            {
                selector: 'a.nav-link[href*="/dates"]',
                replacements: { 'ngày': "Ngày" },
            },
            {
                selector: 'a.pgn__dropdown-item.dropdown-item',
                replacements: { 'Specific Student...': "Học sinh cụ thể..." },
            },
            {
                selector: 'button#masquerade-widget-toggle',
                replacements: { 'Specific Student...': "Học sinh cụ thể..." },
            },
            {
                selector: 'a.nav-item.flex-shrink-0.nav-link',
                replacements: { 'Tiến triển': "Tiến độ" },
            },
            {
                selector: 'a.pgn__dropdown-item.dropdown-item',
                replacements: { 'Staff': "Nhân viên" },
            },
            {
                selector: 'button#masquerade-widget-toggle',
                replacements: { 'Staff': "Nhân viên" },
            },
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

        // ============ FIX COURSE DATES ============
        const replaceCourseDates = (node = document.body) => {
            const replaceInTextNode = (textNode) => {
                // Kiểm tra đã xử lý chưa
                const parent = textNode.parentElement;
                if (parent && parent.hasAttribute(PROCESSED_ATTR)) {
                    return;
                }

                let text = textNode.textContent;
                let modified = false;

                // Pattern 1: "sau X ngày vào ngày Jan 1, 2030" (KHÔNG CÓ DẤU PHẨY SAU THÁNG)
                const regex1 = /sau\s+([\d.,]+)\s+ngày\s+vào ngày\s+(\w+)\s+(\d{1,2}),\s+(\d{4})/gi;
                if (regex1.test(text)) {
                    text = text.replace(regex1, (match, days, month, day, year) => {
                        const monthNum = monthMap[month] || month;
                        const dateStr = `${day.padStart(2, '0')}/${monthNum.toString().padStart(2, '0')}/${year}`;
                        const cleanDays = days.replace(/,/g, '.');
                        return `từ ngày ${dateStr} (${cleanDays} ngày nữa)`;
                    });
                    modified = true;
                }

                // Pattern 2: "in X days vào ngày Month DD, YYYY"
                const regex2 = /in\s+([\d.,]+)\s+days?\s+vào ngày\s+(\w+)\s+(\d{1,2}),\s+(\d{4})/gi;
                if (regex2.test(text)) {
                    text = text.replace(regex2, (match, days, month, day, year) => {
                        const monthNum = monthMap[month] || month;
                        const dateStr = `${day.padStart(2, '0')}/${monthNum.toString().padStart(2, '0')}/${year}`;
                        const cleanDays = days.replace(/,/g, '.');
                        return `từ ngày ${dateStr} (${cleanDays} ngày nữa)`;
                    });
                    modified = true;
                }

                // Pattern 3: "Khóa học bắt đầu in X days"
                const regex3 = /Khóa học bắt đầu\s+in\s+([\d.,]+)\s+days?/gi;
                if (regex3.test(text)) {
                    text = text.replace(regex3, (match, days) => {
                        const cleanDays = days.replace(/,/g, '.');
                        return `Khóa học sẽ bắt đầu sau ${cleanDays} ngày`;
                    });
                    modified = true;
                }

                if (modified) {
                    textNode.textContent = text;
                    if (parent) {
                        parent.setAttribute(PROCESSED_ATTR, 'course-dates');
                    }
                }
            };

            const walker = document.createTreeWalker(
                node,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        const parent = node.parentElement;
                        if (!parent || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
                            return NodeFilter.FILTER_REJECT;
                        }
                        if (node.textContent.trim().length > 0) {
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

            textNodes.forEach(replaceInTextNode);
        };

        // ============ FIX DATE FORMATS ============
        const replaceDates = (node = document.body) => {
            const replaceInTextNode = (textNode) => {
                const parent = textNode.parentElement;
                if (parent && parent.hasAttribute(PROCESSED_ATTR)) {
                    return;
                }

                let text = textNode.textContent;
                let modified = false;

                // BỎ QUA NẾU ĐÃ LÀ FORMAT TIẾNG VIỆT
                if (/Thứ (Hai|Ba|Tư|Năm|Sáu|Bảy)|Chủ Nhật/.test(text)) {
                    return;
                }

                // Pattern 1: "Mon, Nov 24, 2025" hoặc "Monday, November 24, 2025"
                const pattern1 = /\b(Mon|Monday|Tue|Tuesday|Wed|Wednesday|Thu|Thursday|Fri|Friday|Sat|Saturday|Sun|Sunday),?\s+(Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|September|Oct|October|Nov|November|Dec|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi;
                
                const matches1 = text.match(pattern1);
                if (matches1) {
                    matches1.forEach(match => {
                        const formatted = formatDateToVietnamese(match);
                        text = text.replace(match, formatted);
                    });
                    modified = true;
                }

                // Pattern 2: "2025-11-24" (ISO format)
                const pattern2 = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g;
                const matches2 = text.match(pattern2);
                if (matches2) {
                    matches2.forEach(match => {
                        // Validate date trước
                        const [year, month, day] = match.split('-').map(Number);
                        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                            const formatted = formatDateToVietnamese(match);
                            text = text.replace(match, formatted);
                            modified = true;
                        }
                    });
                }

                // Pattern 3: "MM/DD/YYYY"
                const pattern3 = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g;
                const matches3 = text.match(pattern3);
                if (matches3) {
                    matches3.forEach(match => {
                        const [month, day, year] = match.split('/').map(Number);
                        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                            const isoDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                            const formatted = formatDateToVietnamese(isoDate);
                            text = text.replace(match, formatted);
                            modified = true;
                        }
                    });
                }

                // Pattern 4: Standalone months (CHỈ REPLACE NẾU KHÔNG PHẢI PART OF DATE)
                if (!modified) {
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
                }

                if (modified) {
                    textNode.textContent = text;
                    if (parent) {
                        parent.setAttribute(PROCESSED_ATTR, 'dates');
                    }
                }
            };

            const walker = document.createTreeWalker(
                node,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        const parent = node.parentElement;
                        if (!parent || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
                            return NodeFilter.FILTER_REJECT;
                        }
                        if (node.textContent.trim().length > 0) {
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

            textNodes.forEach(replaceInTextNode);
        };

        const replaceAll = () => {
            replaceTexts();
            replaceCourseDates();
            replaceDates();
        };

        // Initial run với delays
        const timeouts = [0, 200, 500, 1000, 2000].map((delay) => 
            setTimeout(replaceAll, delay)
        );

        // Debounced observer
        let observerTimeout;
        const observer = new MutationObserver((mutations) => {
            clearTimeout(observerTimeout);
            observerTimeout = setTimeout(() => {
                replaceTexts();
                
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Xóa attribute cũ để xử lý lại
                            node.querySelectorAll(`[${PROCESSED_ATTR}]`).forEach(el => {
                                el.removeAttribute(PROCESSED_ATTR);
                            });
                            
                            replaceCourseDates(node);
                            replaceDates(node);
                        }
                    });
                });
            }, 100); // Debounce 100ms
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