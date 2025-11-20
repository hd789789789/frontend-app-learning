import { defineMessages } from "@edx/frontend-platform/i18n";

const messages = defineMessages({
    contactSupport: {
        id: "learning.goals.unsubscribe.contact",
        defaultMessage: "liên hệ hỗ trợ",
        description:
            "Its shown as a suggestion or recommendation for learner when their unsubscribing request has failed",
    },
    description: {
        id: "learning.goals.unsubscribe.description",
        defaultMessage: "Bạn sẽ không còn nhận email nhắc nhở về mục tiêu của bạn cho {courseTitle}.",
        description: "It describes the consequences to learner when they unsubscribe of goal reminder service",
    },
    errorHeader: {
        id: "learning.goals.unsubscribe.errorHeader",
        defaultMessage: "Đã xảy ra lỗi",
        description: "It indicate that the unsubscribing request has failed",
    },
    errorDescription: {
        id: "learning.goals.unsubscribe.errorDescription",
        defaultMessage:
            "Chúng tôi không thể hủy đăng ký email nhắc nhở mục tiêu cho bạn. Vui lòng thử lại sau hoặc {contactSupport} để được trợ giúp.",
        description: "Message that notifies user that unsubscribing failed and to try again",
    },
    goToDashboard: {
        id: "learning.goals.unsubscribe.goToDashboard",
        defaultMessage: "Đến bảng điều khiển",
        description: "Anchor text for button that redirects to dashboard page",
    },
    header: {
        id: "learning.goals.unsubscribe.header",
        defaultMessage: "Bạn đã hủy đăng ký nhắc nhở mục tiêu",
        description: "It indicate that the unsubscribing request was successful",
    },
    loading: {
        id: "learning.goals.unsubscribe.loading",
        defaultMessage: "Đang hủy đăng ký…",
        description: "Message shown when the unsubscribing request is processing",
    },
});

export default messages;
