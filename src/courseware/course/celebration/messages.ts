import { defineMessages } from "@edx/frontend-platform/i18n";

const messages = defineMessages({
    completed: {
        id: "learning.celebration.completed",
        defaultMessage: "Bạn vừa hoàn thành phần đầu tiên của khóa học.",
        description: "Shown only once to leaner when they complete their first section",
    },
    congrats: {
        id: "learning.celebration.congrats",
        defaultMessage: "Chúc mừng!",
        description: "Greeting for learners when they complete their weekly goal or finish the first section",
    },
    earned: {
        id: "learning.celebration.earned",
        defaultMessage: "Bạn xứng đáng được điều đó!",
        description: "Shown below congrats messaging when leaner complete a goal",
    },
    emailSubject: {
        id: "learning.celebration.emailSubject",
        defaultMessage: "Tôi đang trên con đường hoàn thành {title} trực tuyến với {platform}!",
        description: "Subject when sharing course progress via email",
    },
    forward: {
        id: "learning.celebration.forward",
        defaultMessage: "Tiếp tục nào",
        description: "Button to close celebration dialog and get back to course",
    },
    goalMet: {
        id: "learning.celebration.goalMet",
        defaultMessage: "Bạn đã đạt được mục tiêu!",
        description: "Headline for (weekly gaol celebration) section in courseware",
    },
    keepItUp: {
        id: "learning.celebration.keepItUp",
        defaultMessage: "Hãy tiếp tục phát huy",
        description: "Button to close celebration dialog and get back to course",
    },
    share: {
        id: "learning.celebration.share",
        defaultMessage: "Hãy dành chút thời gian để ăn mừng và chia sẻ tiến độ của bạn.",
        description: "Text that precedes the (sharing icon) for goal accomplishment ",
    },
    socialMessage: {
        id: "learning.celebration.social",
        defaultMessage:
            "Tôi đang trên con đường hoàn thành {title} trực tuyến với {platform}. Bạn đang dành thời gian học điều gì?",
        description: "Shown when sharing course progress on a social network",
    },
});

export default messages;
