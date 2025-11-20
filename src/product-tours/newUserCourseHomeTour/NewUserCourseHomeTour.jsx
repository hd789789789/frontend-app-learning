import React from "react";
import { FormattedMessage } from "@edx/frontend-platform/i18n";
import {
    DismissButtonFormattedMessage,
    NextButtonFormattedMessage,
    OkayButtonFormattedMessage,
} from "../GenericTourFormattedMessages";

const datesCheckpoint = {
    body: (
        <FormattedMessage
            id="tours.datesCheckpoint.body"
            defaultMessage="Các ngày quan trọng có thể giúp bạn theo dõi tiến độ."
        />
    ),
    placement: "left",
    target: "#courseHome-dates",
    title: <FormattedMessage id="tours.datesCheckpoint.title" defaultMessage="Theo dõi các ngày quan trọng" />,
};

const outlineCheckpoint = {
    body: (
        <FormattedMessage
            id="tours.outlineCheckpoint.body"
            defaultMessage="Bạn có thể khám phá các phần của khóa học bằng cách sử dụng dàn bài bên dưới."
        />
    ),
    placement: "top",
    target: "#courseHome-outline",
    title: <FormattedMessage id="tours.outlineCheckpoint.title" defaultMessage="Tham gia khóa học!" />,
};

const tabNavigationCheckpoint = {
    body: (
        <FormattedMessage
            id="tours.tabNavigationCheckpoint.body"
            defaultMessage="Các tab này có thể được sử dụng để truy cập tài liệu khóa học khác, chẳng hạn như tiến độ của bạn, giáo trình, v.v."
        />
    ),
    placement: "bottom",
    target: "#courseTabsNavigation",
    title: <FormattedMessage id="tours.tabNavigationCheckpoint.title" defaultMessage="Tài nguyên khóa học bổ sung" />,
};

const upgradeCheckpoint = {
    body: (
        <FormattedMessage
            id="tours.upgradeCheckpoint.body"
            defaultMessage="Hướng tới chứng chỉ và có quyền truy cập đầy đủ vào tài liệu khóa học. Nâng cấp ngay!"
        />
    ),
    placement: "left",
    target: "#courseHome-upgradeNotification",
    title: <FormattedMessage id="tours.upgradeCheckpoint.title" defaultMessage="Mở khóa khóa học của bạn" />,
};

const weeklyGoalsCheckpoint = {
    body: (
        <FormattedMessage
            id="tours.weeklyGoalsCheckpoint.body"
            defaultMessage="Đặt mục tiêu giúp bạn có nhiều khả năng hoàn thành khóa học hơn."
        />
    ),
    placement: "left",
    target: "#courseHome-weeklyLearningGoal",
    title: <FormattedMessage id="tours.weeklyGoalsCheckpoint.title" defaultMessage="Đặt mục tiêu khóa học" />,
};

const newUserCourseHomeTour = ({ enabled, onDismiss, onEnd }) => ({
    advanceButtonText: <NextButtonFormattedMessage />,
    checkpoints: [
        outlineCheckpoint,
        datesCheckpoint,
        tabNavigationCheckpoint,
        upgradeCheckpoint,
        weeklyGoalsCheckpoint,
    ],
    dismissButtonText: <DismissButtonFormattedMessage />,
    enabled,
    endButtonText: <OkayButtonFormattedMessage />,
    onDismiss,
    onEnd,
    onEscape: onDismiss,
    tourId: "newUserCourseHomeTour",
});

export default newUserCourseHomeTour;
