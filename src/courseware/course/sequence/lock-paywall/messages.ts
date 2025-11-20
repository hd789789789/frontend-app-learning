import { defineMessages } from "@edx/frontend-platform/i18n";

const messages = defineMessages({
    "learn.lockPaywall.title": {
        id: "learn.lockPaywall.title",
        defaultMessage: "Các bài tập đã chấm điểm bị khóa",
        description:
            "Heading for message shown to indicate that a piece of content is unavailable to audit track users.",
    },
    "learn.lockPaywall.content": {
        id: "learn.lockPaywall.content",
        defaultMessage:
            "Nâng cấp để có quyền truy cập vào các tính năng bị khóa như tính năng này và tận dụng tối đa khóa học của bạn.",
        description: "Message shown to indicate that a piece of content is unavailable to audit track users.",
    },
    "learn.lockPaywall.content.pastExpiration": {
        id: "learn.lockPaywall.content.pastExpiration",
        defaultMessage:
            "Hạn chót nâng cấp cho khóa học này đã qua. Để nâng cấp, hãy ghi danh vào phiên học khả dụng tiếp theo.",
        description:
            "Message shown to indicate that a piece of content is unavailable to audit track users in a course where the expiration deadline has passed.",
    },
    "learn.lockPaywall.courseDetails": {
        id: "learn.lockPaywall.courseDetails",
        defaultMessage: "Xem chi tiết khóa học",
        description: "Link to the course details page for this course with a past expiration date.",
    },
    "learn.lockPaywall.example.alt": {
        id: "learn.lockPaywall.example.alt",
        defaultMessage: "Chứng chỉ mẫu",
        description: "Alternate text displayed when the example certificate image cannot be displayed.",
    },
    "learn.lockPaywall.list.intro": {
        id: "learn.lockPaywall.list.intro",
        defaultMessage: "Khi bạn nâng cấp, bạn:",
        description: "Text displayed to introduce the list of benefits from upgrading.",
    },
});

export default messages;
