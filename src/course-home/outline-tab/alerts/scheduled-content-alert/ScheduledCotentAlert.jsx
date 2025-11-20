import { FormattedMessage } from "@edx/frontend-platform/i18n";
import { Alert, Button } from "@openedx/paragon";
import React from "react";
import PropTypes from "prop-types";

const ScheduledContentAlert = ({ payload }) => {
    const { datesTabLink } = payload;

    return (
        <Alert variant="info">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-center">
                <div className="col-lg-7">
                    <Alert.Heading>
                        <FormattedMessage
                            id="learning.outline.alert.scheduled-content.heading"
                            defaultMessage="Sẽ có thêm nội dung sớm!"
                        />
                    </Alert.Heading>
                    <FormattedMessage
                        id="learning.outline.alert.scheduled-content.body"
                        defaultMessage="Khóa học này sẽ có thêm nội dung được phát hành vào ngày tương lai. Hãy chú ý email cập nhật hoặc kiểm tra lại khóa học này để biết các cập nhật."
                    />
                </div>
                <div className="flex-grow-0 pt-3 pt-lg-0">
                    {datesTabLink && (
                        <Button href={datesTabLink}>
                            <FormattedMessage
                                id="learning.outline.alert.scheduled-content.button"
                                defaultMessage="Xem lịch trình khóa học"
                            />
                        </Button>
                    )}
                </div>
            </div>
        </Alert>
    );
};

ScheduledContentAlert.propTypes = {
    payload: PropTypes.shape({
        datesTabLink: PropTypes.string,
    }).isRequired,
};

export default ScheduledContentAlert;
