import { defineMessages } from "@edx/frontend-platform/i18n";

const messages = defineMessages({
    completed: {
        id: "progress.creditInformation.completed",
        defaultMessage: "Đã hoàn thành",
        description: "Label text if a requirement for (course credit) is satisfied",
    },
    courseCredit: {
        id: "progress.creditInformation.courseCredit",
        defaultMessage: "tín chỉ khóa học",
        description: "Anchor text for link that redirects (course credit) help page",
    },
    minimumGrade: {
        id: "progress.creditInformation.minimumGrade",
        defaultMessage: "Điểm tối thiểu để nhận tín chỉ ({minGrade}%)",
    },
    requirementsHeader: {
        id: "progress.creditInformation.requirementsHeader",
        defaultMessage: "Yêu cầu để nhận tín chỉ khóa học",
        description: "Header for the requirements section in course credit",
    },
    upcoming: {
        id: "progress.creditInformation.upcoming",
        defaultMessage: "Sắp tới",
        description: "It indicate that the a (credit requirement) status is not known yet",
    },
    verificationFailed: {
        id: "progress.creditInformation.verificationFailed",
        defaultMessage: "Xác minh thất bại",
        description: "It indicate that the learner submitted a requirement but is either failed or declined",
    },
    verificationSubmitted: {
        id: "progress.creditInformation.verificationSubmitted",
        defaultMessage: "Đã nộp xác minh",
        description: "It indicate that the learner submitted a requirement but is not graded or reviewed yet",
    },
    creditNotEligibleStatus: {
        id: "progress.creditInformation.creditNotEligible",
        defaultMessage: "Bạn không còn đủ điều kiện nhận tín chỉ trong khóa học này. Tìm hiểu thêm về {creditLink}.",
        description:
            "Message to learner who are not eligible for course credit, it can be that a requirement deadline has passed",
    },
    creditEligibleStatus: {
        id: "progress.creditInformation.creditEligible",
        defaultMessage:
            "Bạn đã đáp ứng các yêu cầu để nhận tín chỉ trong khóa học này. Đến {dashboardLink} của bạn để mua tín chỉ khóa học. Hoặc tìm hiểu thêm về {creditLink}.",
        description:
            "After the credit requirements are met, leaners can then do the last step which purchasing the credit. Note that is only doable for leaners after they met all the requirements",
    },
    creditPartialEligibleStatus: {
        id: "progress.creditInformation.creditPartialEligible",
        defaultMessage: "Bạn chưa đáp ứng các yêu cầu để nhận tín chỉ. Tìm hiểu thêm về {creditLink}.",
        description: "This means that one or more requirements is not satisfied yet",
    },
});

export default messages;
