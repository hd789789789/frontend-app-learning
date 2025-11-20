import { defineMessages } from "@edx/frontend-platform/i18n";

const messages = defineMessages({
    defaultEmailBody: {
        id: "learning.celebration.emailBody",
        defaultMessage: "Bạn đang dành thời gian học điều gì?",
        description: "Body when sharing course progress via email",
    },
    shareEmail: {
        id: "learning.social.shareEmail",
        defaultMessage: "Chia sẻ tiến độ của bạn qua email.",
        description: "Text email share button",
    },
    shareService: {
        id: "learning.social.shareService",
        defaultMessage: "Chia sẻ tiến độ của bạn trên {service}.",
    },
});

export default messages;
