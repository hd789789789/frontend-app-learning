import { useEffect } from "react";

const useTextReplacer = () => {
    useEffect(() => {
        // Map tháng - THÊM CẢ FORMAT ĐÃ ĐƯỢC TRANSLATE
        const monthMap = {
            // Format đã được translate
            'Th1': 1, 'Th2': 2, 'Th3': 3, 'Th4': 4, 'Th5': 5, 'Th6': 6,
            'Th7': 7, 'Th8': 8, 'Th9': 9, 'Th10': 10, 'Th11': 11, 'Th12': 12,
            // Format tiếng Anh
            'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
            'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12,
            // Format đầy đủ
            'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
            'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12,
            // Format tiếng Việt đầy đủ
            'Tháng 1': 1, 'Tháng 2': 2, 'Tháng 3': 3, 'Tháng 4': 4, 
            'Tháng 5': 5, 'Tháng 6': 6, 'Tháng 7': 7, 'Tháng 8': 8,
            'Tháng 9': 9, 'Tháng 10': 10, 'Tháng 11': 11, 'Tháng 12': 12
        };

        // Function format date
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

        // Function thay thế text theo selector
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

        // Function thay thế format ngày tháng khóa học - ĐÃ CẢI THIỆN
        const replaceCourseDates = (node = document.body) => {
            const replaceInTextNode = (textNode) => {
                let text = textNode.textContent;
                let modified = false;

                // Pattern 1: "in X days vào ngày Month DD, YYYY" hoặc "in X,XXX days vào ngày Month DD, YYYY"
                // Hỗ trợ cả Th1-Th12, Jan-Dec, January-December
                const regex1 = /in\s+([\d,]+)\s+days?\s+vào ngày\s+(Th\d{1,2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December|Tháng \d{1,2})\s+(\d{1,2}),\s+(\d{4})/gi;
                
                if (regex1.test(text)) {
                    text = text.replace(regex1, (match, days, month, day, year) => {
                        // Xử lý tháng
                        let monthNum = monthMap[month];
                        if (!monthNum) {
                            // Fallback: thử parse trực tiếp
                            monthNum = parseInt(month.replace(/\D/g, '')) || month;
                        }
                        
                        const dateStr = `${day.padStart(2, '0')}/${monthNum.toString().padStart(2, '0')}/${year}`;
                        // Xóa dấu phẩy trong số ngày để dễ đọc
                        const cleanDays = days.replace(/,/g, '.');
                        return `từ ngày ${dateStr} (${cleanDays} ngày nữa)`;
                    });
                    modified = true;
                }

                // Pattern 2: "Khóa học bắt đầu in X days" -> "Khóa học bắt đầu"
                const regex2 = /Khóa học bắt đầu\s+in\s+([\d,]+)\s+days?/gi;
                if (regex2.test(text)) {
                    text = text.replace(regex2, (match, days) => {
                        const cleanDays = days.replace(/,/g, '.');
                        return `Khóa học sẽ bắt đầu sau ${cleanDays} ngày`;
                    });
                    modified = true;
                }

                // Pattern 3: Xử lý "in X days" còn sót lại
                const regex3 = /\bin\s+([\d,]+)\s+days?\b/gi;
                if (regex3.test(text) && !text.includes('từ ngày')) {
                    text = text.replace(regex3, (match, days) => {
                        const cleanDays = days.replace(/,/g, '.');
                        return `sau ${cleanDays} ngày`;
                    });
                    modified = true;
                }

                if (modified) {
                    textNode.textContent = text;
                }
            };

            // Duyệt qua các text nodes
            const walker = document.createTreeWalker(
                node,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        const parent = node.parentElement;
                        if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
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

        // Function thay thế ngày tháng trong toàn bộ DOM
        const replaceDates = (node = document.body) => {
            const replaceInTextNode = (textNode) => {
                let text = textNode.textContent;
                let modified = false;

                // Pattern 1: "Mon, Nov 24, 2025" hoặc "Monday, November 24, 2025"
                const pattern1 = /\b(Mon|Monday|Tue|Tuesday|Wed|Wednesday|Thu|Thursday|Fri|Friday|Sat|Saturday|Sun|Sunday),?\s+(Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|September|Oct|October|Nov|November|Dec|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi;
                
                if (pattern1.test(text)) {
                    text = text.replace(pattern1, (match) => {
                        try {
                            return formatDateToVietnamese(match);
                        } catch (e) {
                            return match;
                        }
                    });
                    modified = true;
                }

                // Pattern 2: "2025-11-24"
                const pattern2 = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
                if (pattern2.test(text)) {
                    text = text.replace(pattern2, (match) => {
                        try {
                            return formatDateToVietnamese(match);
                        } catch (e) {
                            return match;
                        }
                    });
                    modified = true;
                }

                // Pattern 3: "MM/DD/YYYY" format
                const pattern3 = /\b(\d{2})\/(\d{2})\/(\d{4})\b/g;
                if (pattern3.test(text)) {
                    text = text.replace(pattern3, (match, month, day, year) => {
                        try {
                            // Convert MM/DD/YYYY to YYYY-MM-DD for proper parsing
                            const isoDate = `${year}-${month}-${day}`;
                            return formatDateToVietnamese(isoDate);
                        } catch (e) {
                            return match;
                        }
                    });
                    modified = true;
                }

                // Pattern 4: Các tháng tiếng Anh riêng lẻ (CHẠY SAU CÙNG)
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
                    // Chỉ replace nếu là standalone month (không nằm trong date pattern)
                    const regex = new RegExp(`\\b${eng}\\b(?!\\s+\\d)`, 'g');
                    if (regex.test(text)) {
                        text = text.replace(regex, viet);
                        modified = true;
                    }
                });

                if (modified) {
                    textNode.textContent = text;
                }
            };

            // Duyệt qua các text nodes
            const walker = document.createTreeWalker(
                node,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        const parent = node.parentElement;
                        if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
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

        // Function gộp: ƯU TIÊN course dates trước
        const replaceAll = () => {
            replaceTexts();
            replaceCourseDates(); // CHẠY TRƯỚC replaceDates
            replaceDates();
        };

        // Chạy nhiều lần với delay dài hơn
        const timeouts = [0, 100, 300, 500, 1000, 2000].map((delay) => 
            setTimeout(replaceAll, delay)
        );

        // Observer để theo dõi DOM changes
        const observer = new MutationObserver((mutations) => {
            replaceTexts();
            
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        replaceCourseDates(node); // ƯU TIÊN
                        replaceDates(node);
                    } else if (node.nodeType === Node.TEXT_NODE) {
                        replaceCourseDates(node.parentElement);
                        replaceDates(node.parentElement);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true, // THÊM ĐỂ THEO DÕI TEXT CHANGES
        });

        return () => {
            timeouts.forEach(clearTimeout);
            observer.disconnect();
        };
    }, []);
};

export const TextReplacerProvider = ({ children }) => {
    useTextReplacer();
    return children;
};