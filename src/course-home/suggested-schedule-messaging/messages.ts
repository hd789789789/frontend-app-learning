import { defineMessages } from "@edx/frontend-platform/i18n";

const messages = defineMessages({
    suggestedSchedule: {
        id: "datesBanner.suggestedSchedule",
        defaultMessage:
            "Chúng tôi đã xây dựng lịch trình đề xuất để giúp bạn theo dõi tiến độ. Nhưng đừng lo lắng—nó linh hoạt nên bạn có thể học theo tốc độ của riêng mình.",
        description: "Messaging that explain the gaol and the effect fo the suggested schedule",
    },
    upgradeToCompleteHeader: {
        id: "datesBanner.upgradeToCompleteGradedBanner.header",
        defaultMessage: "Nâng cấp để mở khóa",
        description:
            "Messaging that prompts users to upgrade their course status in order to access locked course content",
    },
    upgradeToCompleteBody: {
        id: "datesBanner.upgradeToCompleteGradedBanner.body",
        defaultMessage:
            "Bạn đang kiểm tra khóa học này, có nghĩa là bạn không thể tham gia vào các bài tập đã chấm điểm. Để hoàn thành các bài tập đã chấm điểm như một phần của khóa học này, bạn có thể nâng cấp ngay hôm nay.",
        description: "It explain the effect of upgrading the course",
    },
    upgradeToCompleteButton: {
        id: "datesBanner.upgradeToCompleteGradedBanner.button",
        defaultMessage: "Nâng cấp ngay",
        description: "Button that prompts users to upgrade their course status",
    },
    upgradeToShiftBody: {
        id: "datesBanner.upgradeToResetBanner.body",
        defaultMessage:
            "Để giữ cho mình đúng tiến độ, bạn có thể cập nhật lịch trình này và chuyển các bài tập quá hạn vào tương lai. Đừng lo lắng—bạn sẽ không mất bất kỳ tiến độ nào mà bạn đã đạt được khi dịch chuyển ngày hạn chót của mình.",
        description: "Text that explain the consequences of resetting dates when learner needs to upgrade to do so",
    },
    upgradeToShiftButton: {
        id: "datesBanner.upgradeToResetBanner.button",
        defaultMessage: "Nâng cấp để dịch chuyển ngày hạn chót",
        description:
            "Button that prompts users to upgrade their course status before they can shift their due dates into the future",
    },
    missedDeadlines: {
        id: "datesBanner.resetDatesBanner.header",
        defaultMessage: "Có vẻ như bạn đã bỏ lỡ một số hạn chót quan trọng dựa trên lịch trình đề xuất của chúng tôi.",
        description: "Text shown when leaner missed assignment due date",
    },
    shiftDatesBody: {
        id: "datesBanner.resetDatesBanner.body",
        defaultMessage:
            "Để giữ cho mình đúng tiến độ, bạn có thể cập nhật lịch trình này và chuyển các bài tập quá hạn vào tương lai. Đừng lo lắng—bạn sẽ không mất bất kỳ tiến độ nào mà bạn đã đạt được khi dịch chuyển ngày hạn chót của mình.",
        description: "Text that explain the consequences of resetting dates",
    },
    shiftDatesButton: {
        id: "datesBanner.resetDatesBanner.button",
        defaultMessage: "Dịch chuyển ngày hạn chót",
        description: "Button that prompts users to move their due dates into the future",
    },
});

export default messages;
