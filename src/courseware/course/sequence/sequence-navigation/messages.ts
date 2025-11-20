import { defineMessages } from "@edx/frontend-platform/i18n";

const messages = defineMessages({
    nextButton: {
        id: "learn.sequence.navigation.next.button",
        defaultMessage: "Tiếp theo",
        description: "Button to advance to the next section",
    },
    nextUpButton: {
        id: "learn.sequence.navigation.next.up.button",
        defaultMessage: "Tiếp theo: {title}",
        description: "Button to advance to the next section, with title",
    },
    previousButton: {
        id: "learn.sequence.navigation.previous.button",
        defaultMessage: "Trước đó",
        description: "Button to return to the previous section",
    },
});

export default messages;
