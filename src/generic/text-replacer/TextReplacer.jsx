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

        // ============ SIMPLE STRING REPLACEMENT - TARGET TOÀN BỘ TEXT ============
        const replaceCourseStartMessage = () => {
            // Target tất cả text nodes trong body
            const allText = document.body.innerText;
            
            // Debug: Log ra để xem text thực sự
            if (allText.includes('in') && allText.includes('days') && allText.includes('vào ngày')) {
                console.log('🔍 Found course start message in DOM');
            }
            
            // Tìm tất cả elements có chứa text cần dịch
            const elements = document.querySelectorAll('*');
            
            elements.forEach(element => {
                // Bỏ qua script, style
                if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') return;
                
                // Chỉ xử lý text nodes trực tiếp của element
                Array.from(element.childNodes).forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        let text = node.textContent;
                        
                        // BỎ QUA nếu đã dịch
                        if (text.includes('sẽ bắt đầu từ ngày') || text.includes('từ ngày') && /\d{2}\/\d{2}\/\d{4}/.test(text)) {
                            return;
                        }
                        
                        // Pattern 1: "Khóa học bắt đầu in X days vào ngày Month D, YYYY."
                        if (/Khóa học bắt đầu\s+in\s+[\d,]+\s+days?\s+vào ngày/.test(text)) {
                            console.log('✅ Match found:', text);
                            
                            // Replace với NHIỀU patterns khác nhau
                            text = text
                                // Pattern với dấu chấm cuối
                                .replace(/Khóa học bắt đầu\s+in\s+([\d,]+)\s+days?\s+vào ngày\s+(\w+)\s+(\d{1,2}),\s+(\d{4})\./gi, 
                                    (match, days, month, day, year) => {
                                        const monthNum = monthMap[month] || month;
                                        const dateStr = `${day.padStart(2, '0')}/${monthNum.toString().padStart(2, '0')}/${year}`;
                                        const cleanDays = days.replace(/,/g, '.');
                                        return `Khóa học sẽ bắt đầu từ ngày ${dateStr} (sau ${cleanDays} ngày).`;
                                    })
                                // Pattern không có dấu chấm
                                .replace(/Khóa học bắt đầu\s+in\s+([\d,]+)\s+days?\s+vào ngày\s+(\w+)\s+(\d{1,2}),\s+(\d{4})/gi, 
                                    (match, days, month, day, year) => {
                                        const monthNum = monthMap[month] || month;
                                        const dateStr = `${day.padStart(2, '0')}/${monthNum.toString().padStart(2, '0')}/${year}`;
                                        const cleanDays = days.replace(/,/g, '.');
                                        return `Khóa học sẽ bắt đầu từ ngày ${dateStr} (sau ${cleanDays} ngày)`;
                                    });
                            
                            if (text !== node.textContent) {
                                console.log('✨ Replaced to:', text);
                                node.textContent = text;
                            }
                        }
                    }
                });
            });
        };

        // ============ DATE FORMATS ============
        const replaceDates = () => {
            const elements = document.querySelectorAll('*');
            
            elements.forEach(element => {
                if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') return;
                
                Array.from(element.childNodes).forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        let text = node.textContent;
                        
                        // BỎ QUA nếu đã có format tiếng Việt
                        if (/(Thứ (Hai|Ba|Tư|Năm|Sáu|Bảy)|Chủ Nhật),\s+\d{2}\/\d{2}\/\d{4}/.test(text)) {
                            return;
                        }
                        
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
                            node.textContent = text;
                        }
                    }
                });
            });
        };

        const replaceAll = () => {
            replaceTexts();
            replaceCourseStartMessage(); // PRIORITY 1
            replaceDates(); // PRIORITY 2
        };

        // Initial run với delays DÀI HƠN
        console.log('🚀 TextReplacer initialized');
        const timeouts = [0, 500, 1000, 2000, 4000, 6000].map((delay) => 
            setTimeout(() => {
                console.log(`⏰ Running replaceAll at ${delay}ms`);
                replaceAll();
            }, delay)
        );

        // Observer
        let observerTimeout;
        const observer = new MutationObserver((mutations) => {
            clearTimeout(observerTimeout);
            observerTimeout = setTimeout(() => {
                console.log('🔄 DOM changed, running replaceAll');
                replaceAll();
            }, 300);
        });

        // Bắt đầu observe SAU 1 giây
        setTimeout(() => {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });
            console.log('👁️ Observer started');
        }, 1000);

        return () => {
            timeouts.forEach(clearTimeout);
            clearTimeout(observerTimeout);
            observer.disconnect();
            console.log('🛑 TextReplacer cleanup');
        };
    }, []);
};

export const TextReplacerProvider = ({ children }) => {
    useTextReplacer();
    return children;
};