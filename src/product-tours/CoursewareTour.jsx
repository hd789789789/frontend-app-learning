import React from "react";
import { FormattedMessage } from "@edx/frontend-platform/i18n";

import { OkayButtonFormattedMessage } from "./GenericTourFormattedMessages";

const coursewareTour = ({ enabled, onEnd }) => ({
    checkpoints: [
        {
            body: (
                <FormattedMessage
                    id="tours.sequenceNavigationCheckpoint.body"
                    defaultMessage="Thanh trên cùng trong khóa học cho phép bạn dễ dàng chuyển đến các phần khác nhau và hiển thị nội dung sắp tới."
                />
            ),
            placement: "bottom",
            target: "#courseware-sequence-navigation",
        },
    ],
    enabled,
    endButtonText: <OkayButtonFormattedMessage />,
    onEnd,
    onEscape: onEnd,
    tourId: "coursewareTour",
});

export default coursewareTour;
