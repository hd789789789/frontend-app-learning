import { defineMessages } from "@edx/frontend-platform/i18n";

const messages = defineMessages({
    headerPlaceholder: {
        id: "learn.header.h2.placeholder",
        defaultMessage: "Tiêu đề cấp 2 có thể được tạo bởi các nhà cung cấp khóa học trong tương lai.",
        description: "Message spoken by a screenreader indicating that the h2 tag is a placeholder.",
    },
    loadFailure: {
        id: "learn.course.load.failure",
        defaultMessage: "Đã xảy ra lỗi khi tải khóa học này.",
        description: "Message when a course fails to load",
    },
    loadingHonorCode: {
        id: "learn.loading.honor.codk",
        defaultMessage: "Đang tải thông điệp quy tắc danh dự...",
        description: "Message shown when an interface about the honor code is being loaded",
    },
    loadingLockedContent: {
        id: "learn.loading.content.lock",
        defaultMessage: "Đang tải thông điệp nội dung bị khóa...",
        description: "Message shown when an interface about locked content is being loaded",
    },
    loadingSequence: {
        id: "learn.loading.learning.sequence",
        defaultMessage: "Đang tải chuỗi học tập...",
        description: "Message when learning sequence is being loaded",
    },
    noContent: {
        id: "learn.sequence.no.content",
        defaultMessage: "Không có nội dung nào ở đây.",
        description: "Message shown when there is no content to show a user inside a learning sequence.",
    },
});

export default messages;
