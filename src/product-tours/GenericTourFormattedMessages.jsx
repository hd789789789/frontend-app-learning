import React from "react";
import { FormattedMessage } from "@edx/frontend-platform/i18n";

export const DismissButtonFormattedMessage = () => (
    <FormattedMessage
        id="tours.button.dismiss"
        defaultMessage="Bỏ qua"
        description="A button used to close the tour of the website"
    />
);

export const NextButtonFormattedMessage = () => (
    <FormattedMessage
        id="tours.button.next"
        defaultMessage="Tiếp theo"
        description="A button used within a tour of the website to advance to the next piece of information"
    />
);

export const OkayButtonFormattedMessage = () => (
    <FormattedMessage
        id="tours.button.okay"
        defaultMessage="Đồng ý"
        description="A button used to end the tour of the website"
    />
);
