import { defineMessages } from "@edx/frontend-platform/i18n";

const messages = defineMessages({
    searchOpenAction: {
        id: "learn.coursewareSearch.openAction",
        defaultMessage: "Tìm kiếm trong khóa học này",
        description: "Aria-label for a button that will pop up Courseware Search.",
    },
    contentSearchButton: {
        id: "learn.coursewareSearch.contentSearchButton",
        defaultMessage: "Tìm kiếm nội dung",
        description: "Text for a button that will pop up Courseware Search.",
    },
    searchSubmitLabel: {
        id: "learn.coursewareSearch.submitLabel",
        defaultMessage: "Tìm kiếm",
        description: "Button label that will submit Courseware Search.",
    },
    searchClearAction: {
        id: "learn.coursewareSearch.clearAction",
        defaultMessage: "Xóa tìm kiếm",
        description: "Button label that will the current Courseware Search input.",
    },
    searchCloseAction: {
        id: "learn.coursewareSearch.closeAction",
        defaultMessage: "Đóng biểu mẫu tìm kiếm",
        description: "Aria-label for a button that will close Courseware Search.",
    },
    searchModuleTitle: {
        id: "learn.coursewareSearch.searchModuleTitle",
        defaultMessage: "Tìm kiếm khóa học này",
        description: "Title for the Courseware Search module.",
    },
    searchBarPlaceholderText: {
        id: "learn.coursewareSearch.searchBarPlaceholderText",
        defaultMessage: "Tìm kiếm",
        description: "Placeholder text for the Courseware Search input control",
    },
    loading: {
        id: "learn.coursewareSearch.loading",
        defaultMessage: "Đang tìm kiếm...",
        description: "Screen reader text to use on the spinner while the search is performing.",
    },
    searchResultsNone: {
        id: "learn.coursewareSearch.searchResultsNone",
        defaultMessage: "Không tìm thấy kết quả.",
        description: "Text to show when the Courseware Search found no results matching the criteria.",
    },
    searchResultsLabel: {
        id: "learn.coursewareSearch.searchResultsLabel",
        defaultMessage: 'Kết quả cho "{keyword}":',
        description: "Text to show above the search results response list.",
    },
    searchResultsError: {
        id: "learn.coursewareSearch.searchResultsError",
        defaultMessage:
            "Đã xảy ra lỗi trong quá trình tìm kiếm. Vui lòng thử lại sau vài phút. Nếu vấn đề vẫn tiếp diễn, vui lòng liên hệ đội ngũ hỗ trợ.",
        description:
            "Error message to show to the users when there's an error with the endpoint or the returned payload format.",
    },

    // These are translations for labeling the filters
    "filter:all": {
        id: "learn.coursewareSearch.filter:all",
        defaultMessage: "Tất cả nội dung",
        description: "Label for the search results filter that shows all content (no filter).",
    },
    "filter:text": {
        id: "learn.coursewareSearch.filter:text",
        defaultMessage: "Văn bản",
        description: "Label for the search results filter that shows results with text content.",
    },
    "filter:video": {
        id: "learn.coursewareSearch.filter:video",
        defaultMessage: "Video",
        description: "Label for the search results filter that shows results with video content.",
    },
    "filter:sequence": {
        id: "learn.coursewareSearch.filter:sequence",
        defaultMessage: "Phần",
        description: "Label for the search results filter that shows results with section content.",
    },
    "filter:other": {
        id: "learn.coursewareSearch.filter:other",
        defaultMessage: "Khác",
        description: "Label for the search results filter that shows results with other content.",
    },
});

export default messages;
