import { defineMessages } from "@edx/frontend-platform/i18n";

const messages = defineMessages({
    certStatusEarnedNotAvailableHeader: {
        id: "cert.alert.earned.unavailable.header.v2",
        defaultMessage: "Điểm và trạng thái chứng chỉ của bạn sẽ sớm có sẵn.",
        description: "Header alerting the user that their certificate will be available soon.",
    },
    certStatusDownloadableHeader: {
        id: "cert.alert.earned.ready.header",
        defaultMessage: "Chúc mừng! Chứng chỉ của bạn đã sẵn sàng.",
        description: "Header alerting the user that their certificate is ready.",
    },
    certStatusNotPassingHeader: {
        id: "cert.alert.notPassing.header",
        defaultMessage: "Bạn chưa đủ điều kiện nhận chứng chỉ",
    },
    certStatusNotPassingButton: {
        id: "cert.alert.notPassing.button",
        defaultMessage: "Xem điểm",
    },
});

export default messages;
