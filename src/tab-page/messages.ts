import { defineMessages } from "@edx/frontend-platform/i18n";

const messages = defineMessages({
    failure: {
        id: "learning.loading.failure",
        defaultMessage: "Đã xảy ra lỗi khi tải khóa học này.",
        description: "Can be because internet connection or any technical other reason",
    },
    loading: {
        id: "learning.loading",
        defaultMessage: "Đang tải trang khóa học…",
        description: "When content of the course is still loading...etc",
    },
});

export default messages;
