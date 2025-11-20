import { defineMessages } from "@edx/frontend-platform/i18n";

const messages = defineMessages({
    notPassingHeader: {
        id: "progress.certificateStatus.notPassingHeader",
        defaultMessage: "Trạng thái chứng chỉ",
        description: "Header text when learner certifcate status is not passing",
    },
    notPassingBody: {
        id: "progress.certificateStatus.notPassingBody",
        defaultMessage: "Để đủ điều kiện nhận chứng chỉ, bạn phải có điểm đạt.",
        description: "Body text when learner certifcate status is not passing",
    },
    inProgressHeader: {
        id: "progress.certificateStatus.inProgressHeader",
        defaultMessage: "Sẽ có thêm nội dung sớm!",
        description: "Header text when learner certifcate is in progress",
    },
    inProgressBody: {
        id: "progress.certificateStatus.inProgressBody",
        defaultMessage:
            "Có vẻ như có thêm nội dung trong khóa học này sẽ được phát hành trong tương lai. Hãy chú ý email cập nhật hoặc kiểm tra lại khóa học của bạn để biết khi nào nội dung này sẽ có sẵn.",
        description: "Body text when learner certifcate is in progress",
    },
    requestableHeader: {
        id: "progress.certificateStatus.requestableHeader",
        defaultMessage: "Trạng thái chứng chỉ",
        description: "Header text when learner certifcate status is requestable",
    },
    requestableBody: {
        id: "progress.certificateStatus.requestableBody",
        defaultMessage:
            "Chúc mừng, bạn đã đủ điều kiện nhận chứng chỉ! Để truy cập chứng chỉ của bạn, hãy yêu cầu bên dưới.",
        description: "Body text when learner certifcate status is requestable",
    },
    requestableButton: {
        id: "progress.certificateStatus.requestableButton",
        defaultMessage: "Yêu cầu chứng chỉ",
        description: "Button text when learner certifcate status is requestable",
    },
    unverifiedHeader: {
        id: "progress.certificateStatus.unverifiedHeader",
        defaultMessage: "Trạng thái chứng chỉ",
        description: "Header text when learner certifcate status is unverified",
    },
    unverifiedButton: {
        id: "progress.certificateStatus.unverifiedButton",
        defaultMessage: "Xác minh danh tính",
        description: "Button text when learner certifcate status is unverified",
    },
    unverifiedPendingBody: {
        id: "progress.certificateStatus.courseCelebration.verificationPending",
        defaultMessage:
            "Xác minh danh tính của bạn đang chờ xử lý và chứng chỉ của bạn sẽ có sẵn sau khi được phê duyệt.",
        description: "Body text when learner certifcate status is unverified pending",
    },
    downloadableHeader: {
        id: "progress.certificateStatus.downloadableHeader",
        defaultMessage: "Chứng chỉ của bạn đã sẵn sàng!",
        description: "Header text when the certifcate is available",
    },
    viewableButton: {
        id: "progress.certificateStatus.viewableButton",
        defaultMessage: "Xem chứng chỉ của tôi",
        description: "Button text which view or links to the certifcate",
    },
    notAvailableHeader: {
        id: "progress.certificateStatus.notAvailableHeader",
        defaultMessage: "Trạng thái chứng chỉ",
        description: "Header text when the certifcate is not available",
    },
    notAvailableEndDateBody: {
        id: "progress.certificateBody.notAvailable.endDate",
        defaultMessage: "Điểm cuối kỳ và bất kỳ chứng chỉ nào đã đạt được dự kiến sẽ có sẵn sau {endDate}.",
        description: "Shown for learners who have finished a course before grades and certificates are available.",
    },
    upgradeHeader: {
        id: "progress.certificateStatus.upgradeHeader",
        defaultMessage: "Nhận chứng chỉ",
        description: "Header text when the learner needs to upgrade to earn a certifcate ",
    },
    upgradeBody: {
        id: "progress.certificateStatus.upgradeBody",
        defaultMessage:
            "Bạn đang trong lộ trình kiểm tra và không đủ điều kiện nhận chứng chỉ. Để hướng tới chứng chỉ, hãy nâng cấp khóa học của bạn ngay hôm nay.",
        description: "Body text when the learner needs to upgrade to earn a certifcate ",
    },
    upgradeButton: {
        id: "progress.certificateStatus.upgradeButton",
        defaultMessage: "Nâng cấp ngay",
        description: "Button text which leaner needs to upgrade to get the certifcate",
    },
    unverifiedHomeHeader: {
        id: "progress.certificateStatus.unverifiedHomeHeader.v2",
        defaultMessage: "Xác minh danh tính của bạn để đủ điều kiện nhận chứng chỉ.",
        description: "Header text when the learner needs to do verification to earn a certifcate ",
    },
    unverifiedHomeButton: {
        id: "progress.certificateStatus.unverifiedHomeButton",
        defaultMessage: "Xác minh danh tính của tôi",
        description: "Button text which leaner needs to do verification to earn a certifcate",
    },
    unverifiedHomeBody: {
        id: "progress.certificateStatus.unverifiedHomeBody",
        defaultMessage: "Để tạo chứng chỉ cho khóa học này, bạn phải hoàn thành quy trình xác minh danh tính.",
        description: "Body text when the learner needs to do verification to earn a certifcate",
    },
});

export default messages;
