import { defineMessages } from "@edx/frontend-platform/i18n";

const messages = defineMessages({
    entranceExamTextNotPassing: {
        id: "learn.sequence.entranceExamTextNotPassing",
        defaultMessage:
            "Để truy cập tài liệu khóa học, bạn phải đạt {entranceExamMinimumScorePct}% hoặc cao hơn trong bài kiểm tra này. Điểm hiện tại của bạn là {entranceExamCurrentScore}%.",
    },
    entranceExamTextPassed: {
        id: "learn.sequence.entranceExamTextPassed",
        defaultMessage: "Điểm của bạn là {entranceExamCurrentScore}%. Bạn đã vượt qua kỳ thi đầu vào.",
    },
});

export default messages;
