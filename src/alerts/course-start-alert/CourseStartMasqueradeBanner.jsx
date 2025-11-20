import React from "react";
import PropTypes from "prop-types";
import { FormattedMessage, FormattedDate } from "@edx/frontend-platform/i18n";
import { PageBanner } from "@openedx/paragon";

import { useModel } from "../../generic/model-store";

const CourseStartMasqueradeBanner = ({ payload }) => {
    const { courseId } = payload;

    const { start, userTimezone } = useModel("courseHomeMeta", courseId);

    const timezoneFormatArgs = userTimezone ? { timeZone: userTimezone } : {};

    return (
        <PageBanner variant="warning">
            <FormattedMessage
                id="instructorToolbar.pageBanner.courseHasNotStarted"
                defaultMessage="Người học này chưa có quyền truy cập vào khóa học này. Khóa học bắt đầu vào {date}."
                description="It's a warning that is shown to course author when being masqueraded as learner, while the course hasn't started for the real learner yet."
                values={{
                    date: (
                        <FormattedDate
                            key="instructorToolbar.pageBanner.courseStartDate"
                            value={start}
                            {...timezoneFormatArgs}
                        />
                    ),
                }}
            />
        </PageBanner>
    );
};

CourseStartMasqueradeBanner.propTypes = {
    payload: PropTypes.shape({
        courseId: PropTypes.string.isRequired,
    }).isRequired,
};

export default CourseStartMasqueradeBanner;
