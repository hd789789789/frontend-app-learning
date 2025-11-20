import { defineMessages } from "@edx/frontend-platform/i18n";

const messages = defineMessages({
    genericError: {
        id: "masquerade-widget.userName.error.generic",
        defaultMessage: "Đã xảy ra lỗi; vui lòng thử lại.",
        description: "Message shown after a general error when attempting to masquerade",
    },
    placeholder: {
        id: "masquerade-widget.userName.input.placeholder",
        defaultMessage: "Tên người dùng hoặc email",
        description: "Placeholder text to prompt for a user to masquerade as",
    },
    userNameLabel: {
        id: "masquerade-widget.userName.input.label",
        defaultMessage: "Giả mạo người dùng này",
        description: "Label for the masquerade user input",
    },
    titleViewAs: {
        id: "instructor.toolbar.view.as",
        defaultMessage: "Xem khóa học này với vai trò:",
        description: "Button to view this course as",
    },
    titleStaff: {
        id: "instructor.toolbar.staff",
        defaultMessage: "Nhân viên",
        description: "Button Staff",
    },
});

export default messages;
