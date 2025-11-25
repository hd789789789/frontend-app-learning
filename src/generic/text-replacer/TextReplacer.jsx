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

        const processedElements = new WeakSet();
        
        const replaceCourseStartMessage = () => {
            // Tìm tất cả elements chứa pattern
            const targetElements = [];
            document.querySelectorAll('*').forEach(el => {
                if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
                if (processedElements.has(el)) return;
                
                const text = el.textContent;
                if (text.includes('Khóa học bắt đầu in') && text.includes('days vào ngày')) {
                    // Chỉ lấy elements KHÔNG có child elements (chỉ có text nodes)
                    const hasOnlyTextNodes = Array.from(el.childNodes).every(
                        node => node.nodeType === Node.TEXT_NODE
                    );
                    
                    if (hasOnlyTextNodes) {
                        targetElements.push(el);
                    }
                }
            });
            
            // Sắp xếp để lấy element nhỏ nhất
            targetElements.sort((a, b) => a.textContent.length - b.textContent.length);
            
            const targetElement = targetElements[0];
            if (!targetElement) return;
            
            console.log('🎯 Target element:', targetElement.tagName);
            
            // Lấy FULL TEXT từ element
            let fullText = targetElement.textContent;
            console.log('📝 Full text:', fullText);
            
            // BỎ QUA nếu đã dịch
            if (fullText.includes('sẽ bắt đầu từ ngày')) {
                console.log('⏭️ Already translated');
                processedElements.add(targetElement);
                return;
            }
            
            const originalText = fullText;
            
            // Replace pattern với dấu chấm
            fullText = fullText.replace(
                /Khóa học bắt đầu\s+in\s+([\d,]+)\s+days?\s+vào ngày\s+(\w+)\s+(\d{1,2}),\s+(\d{4})\./gi,
                (match, days, month, day, year) => {
                    console.log('✅ Pattern 1 matched:', match);
                    const monthNum = monthMap[month] || month;
                    const dateStr = `${day.padStart(2, '0')}/${monthNum.toString().padStart(2, '0')}/${year}`;
                    const cleanDays = days.replace(/,/g, '.');
                    return `Khóa học sẽ bắt đầu từ ngày ${dateStr} (sau ${cleanDays} ngày).`;
                }
            );
            
            // Replace pattern không có dấu chấm
            fullText = fullText.replace(
                /Khóa học bắt đầu\s+in\s+([\d,]+)\s+days?\s+vào ngày\s+(\w+)\s+(\d{1,2}),\s+(\d{4})/gi,
                (match, days, month, day, year) => {
                    console.log('✅ Pattern 2 matched:', match);
                    const monthNum = monthMap[month] || month;
                    const dateStr = `${day.padStart(2, '0')}/${monthNum.toString().padStart(2, '0')}/${year}`;
                    const cleanDays = days.replace(/,/g, '.');
                    return `Khóa học sẽ bắt đầu từ ngày ${dateStr} (sau ${cleanDays} ngày)`;
                }
            );
            
            if (fullText !== originalText) {
                console.log('✨ Replacement successful!');
                console.log('📤 New text:', fullText);
                
                // SET textContent (safe vì element CHỈ chứa text nodes)
                targetElement.textContent = fullText;
                processedElements.add(targetElement);
            } else {
                console.log('❌ No match found');
            }
        };

        // ============ DATE FORMATS ============
        const replaceDates = () => {
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        const parent = node.parentElement;
                        if (!parent || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
                            return NodeFilter.FILTER_REJECT;
                        }
                        
                        // Bỏ qua nếu parent đã được xử lý
                        if (processedElements.has(parent)) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        
                        const text = node.textContent;
                        if (/(Thứ (Hai|Ba|Tư|Năm|Sáu|Bảy)|Chủ Nhật),\s+\d{2}\/\d{2}\/\d{4}/.test(text)) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        
                        return NodeFilter.FILTER_ACCEPT;
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

                // Pattern 1: "Mon, Nov 24, 2025"
                const pattern1 = /\b(Mon|Monday|Tue|Tuesday|Wed|Wednesday|Thu|Thursday|Fri|Friday|Sat|Saturday|Sun|Sunday),?\s+(Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|September|Oct|October|Nov|November|Dec|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi;
                
                const matches1 = [...text.matchAll(pattern1)];
                if (matches1.length > 0) {
                    matches1.forEach(match => {
                        const formatted = formatDateToVietnamese(match[0]);
                        text = text.replace(match[0], formatted);
                        modified = true;
                    });
                }

                // Pattern 2: "2025-11-24"
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
            replaceCourseStartMessage();
            replaceDates();
        };

        console.log('🚀 TextReplacer initialized');
        const timeouts = [0, 500, 1000, 2000, 4000].map((delay) => 
            setTimeout(() => {
                console.log(`⏰ Running replaceAll at ${delay}ms`);
                replaceAll();
            }, delay)
        );

        let observerTimeout;
        const observer = new MutationObserver(() => {
            clearTimeout(observerTimeout);
            observerTimeout = setTimeout(() => {
                replaceAll();
            }, 300);
        });

        setTimeout(() => {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });
        }, 1000);

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