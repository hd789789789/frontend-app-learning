import { useEffect, createContext, useContext } from 'react';

const TextReplacerContext = createContext({});
export const useTextReplacer = () => useContext(TextReplacerContext);

class DateConverter {
    constructor() {
        this.monthNames = {
            'january': 1, 'jan': 1, 'february': 2, 'feb': 2, 'march': 3, 'mar': 3,
            'april': 4, 'apr': 4, 'may': 5, 'june': 6, 'jun': 6, 'july': 7, 'jul': 7,
            'august': 8, 'aug': 8, 'september': 9, 'sep': 9, 'sept': 9,
            'october': 10, 'oct': 10, 'november': 11, 'nov': 11, 'december': 12, 'dec': 12
        };
        this.daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        this.patterns = [
            { regex: /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi, parse: (m) => this.parseFullFormat(m) },
            { regex: /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi, parse: (m) => this.parseMonthDayYear(m) },
            { regex: /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/gi, parse: (m) => this.parseDayMonthYear(m) },
            { regex: /\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/g, parse: (m) => this.parseISOFormat(m) },
            { regex: /\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/g, parse: (m) => this.parseDDMMYYYY(m) }
        ];
    }

    parseFullFormat(match) {
        const parts = match.split(/,?\s+/);
        const month = this.monthNames[parts[1].toLowerCase()];
        if (!month) return null;
        const date = new Date(parseInt(parts[3]), month - 1, parseInt(parts[2].replace(',', '')));
        return this.formatToVietnamese(date);
    }

    parseMonthDayYear(match) {
        const parts = match.split(/[,\s]+/);
        const month = this.monthNames[parts[0].toLowerCase()];
        if (!month) return null;
        const date = new Date(parseInt(parts[2]), month - 1, parseInt(parts[1]));
        return this.formatToVietnamese(date);
    }

    parseDayMonthYear(match) {
        const parts = match.split(/\s+/);
        const month = this.monthNames[parts[1].toLowerCase()];
        if (!month) return null;
        const date = new Date(parseInt(parts[2]), month - 1, parseInt(parts[0]));
        return this.formatToVietnamese(date);
    }

    parseISOFormat(match) {
        const parts = match.split(/[-/]/);
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return this.formatToVietnamese(date);
    }

    parseDDMMYYYY(match) {
        const parts = match.split(/[-/]/);
        const day = parseInt(parts[0]), month = parseInt(parts[1]), year = parseInt(parts[2]);
        if (month > 12 || day > 31) return null;
        const date = new Date(year, month - 1, day);
        return this.formatToVietnamese(date);
    }

    formatToVietnamese(date) {
        if (!(date instanceof Date) || isNaN(date)) return null;
        const dayOfWeek = this.daysOfWeek[date.getDay()];
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${dayOfWeek}, ${day}/${month}/${year}`;
    }

    processTextNode(textNode) {
        if (!textNode?.nodeValue) return;
        let text = textNode.nodeValue;
        let hasChanges = false;

        for (const pattern of this.patterns) {
            const matches = [...text.matchAll(pattern.regex)];
            for (const match of matches.reverse()) {
                const vietnameseDate = pattern.parse(match[0]);
                if (vietnameseDate) {
                    text = text.substring(0, match.index) + vietnameseDate + text.substring(match.index + match[0].length);
                    hasChanges = true;
                }
            }
        }

        if (hasChanges) textNode.nodeValue = text;
    }

    processElement(element) {
        const excludeTags = ['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'INPUT'];
        if (excludeTags.includes(element.tagName) || element.dataset?.dateConverted === 'true') return;

        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => {
                if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
                const parent = node.parentElement;
                if (parent && excludeTags.includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) textNodes.push(node);
        textNodes.forEach(textNode => this.processTextNode(textNode));
        if (element.dataset) element.dataset.dateConverted = 'true';
    }
}

export function TextReplacerProvider({ children, enabled = true }) {
    useEffect(() => {
        if (!enabled) return;

        // Text translations cũ
        const translations = [
            { selector: 'a.nav-link[href*="/dates"]', replacements: { 'ngày': "Ngày" } },
            { selector: 'a.pgn__dropdown-item.dropdown-item', replacements: { 'Specific Student...': "Học sinh cụ thể..." } },
            { selector: 'button#masquerade-widget-toggle', replacements: { 'Specific Student...': "Học sinh cụ thể..." } },
            { selector: 'a.nav-item.flex-shrink-0.nav-link', replacements: { 'Tiến triển': "Tiến độ" } },
        ];

        const replaceTexts = () => {
            translations.forEach(({ selector, replacements }) => {
                const elements = document.querySelectorAll(selector);
                elements.forEach((el) => {
                    Object.entries(replacements).forEach(([vi, en]) => {
                        if (el.textContent.trim() === vi) el.textContent = en;
                    });
                });
            });
        };

        // Date converter
        const converter = new DateConverter();
        let processingQueue = new Set();
        let isProcessing = false;

        const processQueue = () => {
            if (isProcessing || processingQueue.size === 0) return;
            isProcessing = true;
            const elements = Array.from(processingQueue);
            processingQueue.clear();

            const batchSize = 10;
            let index = 0;
            const processBatch = () => {
                const batch = elements.slice(index, index + batchSize);
                batch.forEach(element => {
                    if (element?.isConnected) {
                        try { converter.processElement(element); } 
                        catch (error) { console.warn('Date conversion error:', error); }
                    }
                });
                index += batchSize;
                if (index < elements.length) requestAnimationFrame(processBatch);
                else {
                    isProcessing = false;
                    if (processingQueue.size > 0) setTimeout(processQueue, 100);
                }
            };
            requestAnimationFrame(processBatch);
        };

        const queueElement = (element) => {
            if (element?.nodeType === Node.ELEMENT_NODE) {
                processingQueue.add(element);
                setTimeout(processQueue, 50);
            }
        };

        // Initial processing
        replaceTexts();
        converter.processElement(document.body);

        // Multiple timeouts for text replacement
        const timeouts = [100, 300, 500, 1000].map((delay) => setTimeout(replaceTexts, delay));

        // Observer
        const observer = new MutationObserver((mutations) => {
            replaceTexts();
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) queueElement(node);
                    else if (node.nodeType === Node.TEXT_NODE) converter.processTextNode(node);
                });
                if (mutation.type === 'characterData' && mutation.target.nodeType === Node.TEXT_NODE) {
                    converter.processTextNode(mutation.target);
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true, characterData: true });

        return () => {
            timeouts.forEach(clearTimeout);
            observer.disconnect();
            processingQueue.clear();
        };
    }, [enabled]);

    return <TextReplacerContext.Provider value={{ enabled }}>{children}</TextReplacerContext.Provider>;
}

export default TextReplacerProvider;