import React from "react";
import { FormattedMessage } from "@edx/frontend-platform/i18n";

import { OkayButtonFormattedMessage } from "./GenericTourFormattedMessages";

const existingUserCourseHomeTour = ({ enabled, onEnd }) => ({
    checkpoints: [
        {
            body: (
                <FormattedMessage
                    id="tours.existingUserTour.launchTourCheckpoint.body"
                    defaultMessage="Gần đây, chúng tôi đã bổ sung một vài tính năng mới vào trải nghiệm khóa học. Bạn cần hỗ trợ tìm hiểu thêm? Hãy tham gia tour để tìm hiểu thêm."
                />
            ),
            placement: "left",
            target: "#courseHome-launchTourLink",
        },
    ],
    enabled,
    endButtonText: <OkayButtonFormattedMessage />,
    onEnd,
    onEscape: onEnd,
    tourId: "existingUserCourseHomeTour",
});

export default existingUserCourseHomeTour;
