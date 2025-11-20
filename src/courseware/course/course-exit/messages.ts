import { defineMessages } from "@edx/frontend-platform/i18n";

const messages = defineMessages({
    applyForCredit: {
        id: "courseExit.programs.applyForCredit",
        defaultMessage: "Nộp đơn xin tín chỉ",
        description: "Button for the learner to apply for course credit",
    },
    certificateHeaderDownloadable: {
        id: "courseCelebration.certificateHeader.downloadable",
        defaultMessage: "Chứng chỉ của bạn đã sẵn sàng!",
        description: "Text displayed when course certificate is ready to be downloaded",
    },
    certificateHeaderNotAvailable: {
        id: "courseCelebration.certificateHeader.notAvailable",
        defaultMessage: "Điểm và trạng thái chứng chỉ của bạn sẽ sớm có sẵn.",
        description: "Header displayed when course certificate is not yet available to be viewed",
    },
    certificateNotAvailableBodyAccessCert: {
        id: "courseCelebration.certificateBody.notAvailable.accessCertificate",
        defaultMessage: "Nếu bạn đã đạt điểm đạt, chứng chỉ của bạn sẽ được cấp tự động.",
        description: "Text displayed when course certificate is not yet available to be viewed",
    },
    certificateNotAvailableEndDateBody: {
        id: "courseCelebration.certificateBody.notAvailable.endDate",
        defaultMessage: "Điểm cuối kỳ và bất kỳ chứng chỉ nào đã đạt được dự kiến sẽ có sẵn sau {endDate}.",
        description: "Shown for learners who have finished a course before grades and certificates are available.",
    },
    certificateHeaderUnverified: {
        id: "courseCelebration.certificateHeader.unverified",
        defaultMessage: "Bạn phải hoàn thành xác minh để nhận chứng chỉ của mình.",
        description:
            "Text displayed when a user has not verified their identity and cannot view their course certificate",
    },
    certificateHeaderRequestable: {
        id: "courseCelebration.certificateHeader.requestable",
        defaultMessage: "Chúc mừng, bạn đã đủ điều kiện nhận chứng chỉ!",
        description: "Text displayed when a user has completed the course and can request a certificate",
    },
    certificateHeaderUpgradable: {
        id: "courseCelebration.certificateHeader.upgradable",
        defaultMessage: "Nâng cấp để theo đuổi chứng chỉ đã xác minh",
        description: "Header when learner finished or pass the course but need to upgrade to get a certificate",
    },
    certificateImage: {
        id: "courseCelebration.certificateImage",
        defaultMessage: "Chứng chỉ mẫu",
        description: "Alt text used to describe an image of a certificate",
    },
    completedCourseHeader: {
        id: "courseCelebration.completedCourseHeader",
        defaultMessage: "Bạn đã hoàn thành khóa học của mình.",
        description: "Header text for course exit section",
    },
    congratulationsHeader: {
        id: "courseCelebration.congratulationsHeader",
        defaultMessage: "Chúc mừng!",
        description: "Greeting learner for finishing the course",
    },
    congratulationsImage: {
        id: "courseCelebration.congratulationsImage",
        defaultMessage: "Bốn người giơ tay lên ăn mừng",
        description: "Alt text used to describe celebratory image",
    },
    courseInProgressDescription: {
        id: "courseExit.courseInProgressDescription",
        defaultMessage:
            "Có vẻ như có thêm nội dung trong khóa học này sẽ được phát hành trong tương lai. Hãy chú ý email cập nhật hoặc kiểm tra lại khóa học của bạn để biết khi nào nội dung này sẽ có sẵn.",
        description: "Shown to learner when they finish all available assignments, but not the whole course",
    },
    courseInProgressHeader: {
        id: "courseExit.courseInProgressHeader",
        defaultMessage: "Sẽ có thêm nội dung sớm!",
        description: "Header when the status of the course not all of (contents or assignments) available yet",
    },
    dashboardLink: {
        id: "courseExit.dashboardLink",
        defaultMessage: "Bảng điều khiển",
        description: "Link to user’s dashboard",
    },
    endOfCourseDescription: {
        id: "courseExit.endOfCourseDescription",
        defaultMessage:
            "Rất tiếc, bạn hiện không đủ điều kiện nhận chứng chỉ. Bạn cần nhận điểm đạt để đủ điều kiện nhận chứng chỉ.",
        description: "Shown to learner when they did not pass the course",
    },
    endOfCourseHeader: {
        id: "courseExit.endOfCourseHeader",
        defaultMessage: "Bạn đã đến cuối khóa học!",
    },
    endOfCourseTitle: {
        id: "courseExit.endOfCourseTitle",
        defaultMessage: "Kết thúc khóa học",
    },
    idVerificationSupportLink: {
        id: "courseExit.idVerificationSupportLink",
        defaultMessage: "Tìm hiểu thêm về xác minh danh tính",
        description: "Link to an article about identity verification",
    },
    linkedinAddToProfileButton: {
        id: "courseCelebration.linkedinAddToProfileButton",
        defaultMessage: "Thêm vào hồ sơ LinkedIn",
        description: "Button to add certificate information to the user’s LinkedIn profile",
    },
    microBachelorsLearnMore: {
        id: "courseExit.programs.microBachelors.learnMore",
        defaultMessage:
            "Tìm hiểu thêm về cách thông tin xác thực MicroBachelors của bạn có thể được áp dụng cho tín chỉ.",
    },
    microMastersLearnMore: {
        id: "courseExit.programs.microMasters.learnMore",
        defaultMessage: "Tìm hiểu thêm về quy trình áp dụng chứng chỉ MicroMasters cho bằng Thạc sĩ.",
    },
    microMastersMessage: {
        id: "courseExit.programs.microMasters.mastersMessage",
        defaultMessage:
            "Nếu bạn quan tâm đến việc sử dụng chứng chỉ MicroMasters của mình cho chương trình Thạc sĩ, bạn có thể bắt đầu ngay hôm nay!",
    },
    nextButtonComplete: {
        id: "learn.sequence.navigation.complete.button", // for historical reasons
        defaultMessage: "Hoàn thành khóa học",
        description:
            "This text is shown on the button which usually links to the next unit or assignment in course sequence, however when it is the last unit. The button will link to course exit page",
    },
    nextButtonEnd: {
        id: "courseExit.nextButton.endOfCourse",
        defaultMessage: "Tiếp theo (kết thúc khóa học)",
        description: "This shown for the button which links to the next unit, when learner did not pass the course",
    },
    profileLink: {
        id: "courseExit.profileLink",
        defaultMessage: "Hồ sơ",
        description: "Link to user’s profile",
    },
    programsLastCourseHeader: {
        id: "courseExit.programs.lastCourse",
        defaultMessage: "Bạn đã hoàn thành khóa học cuối cùng trong {title}!",
        description:
            "This shown to learner when the course they completed is the last one of a program, the program might be mircomaster, or microbachelors...etc",
    },
    requestCertificateBodyText: {
        id: "courseCelebration.requestCertificateBodyText",
        defaultMessage: "Để truy cập chứng chỉ của bạn, hãy yêu cầu bên dưới.",
        description: "Shown when learner need to request the certifcate",
    },
    requestCertificateButton: {
        id: "courseCelebration.requestCertificateButton",
        defaultMessage: "Yêu cầu chứng chỉ",
        description: "Button to request the course certificate",
    },
    searchOurCatalogLink: {
        id: "courseExit.searchOurCatalogLink",
        defaultMessage: "Tìm kiếm danh mục của chúng tôi",
        description: "First part of a sentence that continues afterward",
    },
    shareMessage: {
        id: "courseCelebration.shareMessage",
        defaultMessage: "Chia sẻ thành công của bạn trên mạng xã hội hoặc email.",
        description: "Recommending an action when learner pass the course",
    },
    socialMessage: {
        id: "courseExit.social.shareCompletionMessage",
        defaultMessage: "Tôi vừa hoàn thành {title} với {platform}!",
        description: "Shown when sharing course progress on a social network",
    },
    upgradeButton: {
        id: "courseExit.upgradeButton",
        defaultMessage: "Nâng cấp ngay",
    },
    upgradeLink: {
        id: "courseExit.upgradeLink",
        defaultMessage: "nâng cấp ngay",
    },
    verificationPending: {
        id: "courseCelebration.verificationPending",
        defaultMessage:
            "Xác minh danh tính của bạn đang chờ xử lý và chứng chỉ của bạn sẽ có sẵn sau khi được phê duyệt.",
        description: "Shown when the status of verification is pending",
    },
    verifiedCertificateSupportLink: {
        id: "courseExit.verifiedCertificateSupportLink",
        defaultMessage: "Tìm hiểu thêm về chứng chỉ đã xác minh",
        description: "Anchor text for link that redirect to external help page about verified certificates",
    },
    verifyIdentityButton: {
        id: "courseCelebration.verifyIdentityButton",
        defaultMessage: "Xác minh danh tính ngay",
        description: "Button to verify the identify of the user",
    },
    viewCertificateButton: {
        id: "courseCelebration.viewCertificateButton",
        defaultMessage: "Xem chứng chỉ của tôi",
        description: "Button to view the course certificate",
    },
    viewCourseScheduleButton: {
        id: "courseExit.viewCourseScheduleButton",
        defaultMessage: "Xem lịch trình khóa học",
        description: "Button to view the course schedule",
    },
    viewCoursesButton: {
        id: "courseExit.viewCoursesButton",
        defaultMessage: "Xem các khóa học của tôi",
        description: "Button to redirect user to their course dashboard",
    },
    viewGradesButton: {
        id: "courseExit.viewGradesButton",
        defaultMessage: "Xem điểm",
    },
});

export default messages;
