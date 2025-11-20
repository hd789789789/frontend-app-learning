import { defineMessages } from "@edx/frontend-platform/i18n";

const messages = defineMessages({
    completed: {
        id: "learning.dates.badge.completed",
        defaultMessage: "Đã hoàn thành",
        description: "shown as label for the assignments which learner has completed.",
    },
    dueNext: {
        id: "learning.dates.badge.dueNext",
        defaultMessage: "Sắp đến hạn",
        description: "Shown as label for the assignment which date is in the future",
    },
    pastDue: {
        id: "learning.dates.badge.pastDue",
        defaultMessage: "Quá hạn",
        description: "Shown as label for the assignments which deadline has passed",
    },
    title: {
        id: "learning.dates.title",
        defaultMessage: "Ngày quan trọng",
        description: "The title of dates tab (course timeline).",
    },
    today: {
        id: "learning.dates.badge.today",
        defaultMessage: "Hôm nay",
        description: "Label used when the scheduled date for the assignment matches the current day",
    },
    unreleased: {
        id: "learning.dates.badge.unreleased",
        defaultMessage: "Chưa phát hành",
        description: "Shown as label for assignments which date is unknown yet",
    },
    verifiedOnly: {
        id: "learning.dates.badge.verifiedOnly",
        defaultMessage: "Chỉ dành cho người đã xác minh",
        description: "Shown as label for assignments which learner has no access to.",
    },
});

export default messages;
