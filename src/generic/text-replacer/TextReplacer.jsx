import { useEffect } from "react";

const useTextReplacer = () => {
    useEffect(() => {
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
                selector: 'a.nav-item.flex-shrink-0.nav-link',
                replacements: { 'Tiến triển': "Tiến độ" },
            },
            // Thêm các translation khác ở đây
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

        // Chạy nhiều lần để đảm bảo DOM đã load
        const timeouts = [0, 100, 300, 500, 1000].map((delay) => setTimeout(replaceTexts, delay));

        // Observer để theo dõi DOM changes
        const observer = new MutationObserver(() => {
            replaceTexts();
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
