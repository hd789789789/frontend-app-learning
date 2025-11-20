import { defineMessages } from "@edx/frontend-platform/i18n";

const messages = defineMessages({
    alert: {
        id: "learning.enrollment.alert",
        defaultMessage: "Bạn phải ghi danh vào khóa học để xem nội dung khóa học.",
        description:
            "Message shown to indicate that a user needs to enroll in a course prior to viewing the course content.  Shown as part of an alert, along with a link to enroll.",
    },
    staffAlert: {
        id: "learning.staff.enrollment.alert",
        defaultMessage: "Bạn đang xem khóa học này với vai trò nhân viên và chưa ghi danh.",
        description:
            "Message shown to indicate that a user is not enrolled, but is able to view a course anyway because they are staff. Shown as part of an alert, along with a link to enroll.",
    },
    enrollNowInline: {
        id: "learning.enrollment.enrollNow.Inline",
        defaultMessage: "Ghi danh ngay",
        description:
            "A link prompting the user to click on it to enroll in the currently viewed course." +
            "This text is meant to be used at the beginning of a sentence (example: Enroll now to view course content.)",
    },
    enrollNowSentence: {
        id: "learning.enrollment.enrollNow.Sentence",
        defaultMessage: "Ghi danh ngay.",
        description: "A link prompting the user to click on it to enroll in the currently viewed course.",
    },
    success: {
        id: "learning.enrollment.success",
        defaultMessage: "Bạn đã ghi danh thành công vào khóa học này!",
        description: "A message telling the user that their course enrollment was successful.",
    },
});

export default messages;
