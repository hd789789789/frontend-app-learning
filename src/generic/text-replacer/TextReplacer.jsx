import { useEffect } from "react";

const useTextReplacer = () => {
    useEffect(() => {
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

                // Pattern 2: "2025-11-24" hoặc "11/24/2025"
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

                // Pattern 3: Các tháng tiếng Anh riêng lẻ
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
                    const regex = new RegExp(`\\b${eng}\\b`, 'g');
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
                        // Bỏ qua script, style tags
                        const parent = node.parentElement;
                        if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        // Chỉ xử lý node có nội dung
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

        // Function gộp: thay thế text và date
        const replaceAll = () => {
            replaceTexts();
            replaceDates();
        };

        // Chạy nhiều lần để đảm bảo DOM đã load
        const timeouts = [0, 100, 300, 500, 1000].map((delay) => 
            setTimeout(replaceAll, delay)
        );

        // Observer để theo dõi DOM changes
        const observer = new MutationObserver((mutations) => {
            replaceTexts();
            
            // Chỉ replace date cho nodes mới thêm vào
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        replaceDates(node);
                    } else if (node.nodeType === Node.TEXT_NODE) {
                        replaceDates(node.parentElement);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
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