import React from "react";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FormattedMessage } from "@edx/frontend-platform/i18n";
import { getConfig } from "@edx/frontend-platform";

const CheckmarkBullet = () => (
    <span className="fa-li">
        <FontAwesomeIcon icon={faCheck} />
    </span>
);

// Must be child of a <ul className="fa-ul">
export const VerifiedCertBullet = () => {
    const verifiedCertLink = (
        <a
            className="inline-link-underline font-weight-bold"
            rel="noopener noreferrer"
            target="_blank"
            href={`${getConfig().MARKETING_SITE_BASE_URL}/verified-certificate`}
        >
            <FormattedMessage
                id="learning.generic.upsell.verifiedCertBullet.verifiedCert"
                defaultMessage="chứng chỉ đã xác minh"
                description="Bolded words 'verified certificate', which is the name of credential the learner receives."
            />
            <span className="sr-only">
                <FormattedMessage
                    id="learning.generic.upsell.verifiedCertBullet.verifiedCert.newTab.screenreaderOnly.message"
                    defaultMessage=" (tìm hiểu thêm trong tab mới)"
                />
            </span>
        </a>
    );
    return (
        <li className="upsell-bullet">
            <CheckmarkBullet />
            <FormattedMessage
                id="learning.generic.upsell.verifiedCertBullet"
                defaultMessage="Nhận {verifiedCertLink} hoàn thành để thể hiện trên sơ yếu lý lịch của bạn"
                description="Bullet showcasing benefit of earned credential."
                values={{ verifiedCertLink }}
            />
        </li>
    );
};

// Must be child of a <ul className="fa-ul">
export const UnlockGradedBullet = () => {
    const gradedAssignmentsInBoldText = (
        <span className="font-weight-bold">
            <FormattedMessage
                id="learning.generic.upsell.unlockGradedBullet.gradedAssignments"
                defaultMessage="bài tập đã chấm điểm"
                description="Bolded words 'graded assignments', which are the bolded portion of a bullet point highlighting that course content is unlocked when purchasing an upgrade. Graded assignments are any course content that is graded and are unlocked by upgrading to verified certificates."
            />
        </span>
    );
    return (
        <li className="upsell-bullet">
            <CheckmarkBullet />
            <FormattedMessage
                id="learning.generic.upsell.unlockGradedBullet"
                defaultMessage="Mở khóa quyền truy cập của bạn vào tất cả các hoạt động khóa học, bao gồm {gradedAssignmentsInBoldText}"
                description="Bullet showcasing benefit of additional course material."
                values={{ gradedAssignmentsInBoldText }}
            />
        </li>
    );
};

// Must be child of a <ul className="fa-ul">
export const FullAccessBullet = () => {
    const fullAccessInBoldText = (
        <span className="font-weight-bold">
            <FormattedMessage
                id="learning.generic.upsell.fullAccessBullet.fullAccess"
                defaultMessage="Quyền truy cập đầy đủ"
                description="Bolded phrase 'Full access', which is the bolded portion of a bullet point highlighting that access to course content will not have time limits."
            />
        </span>
    );
    return (
        <li className="upsell-bullet">
            <CheckmarkBullet />
            <FormattedMessage
                id="learning.generic.upsell.fullAccessBullet"
                defaultMessage="{fullAccessInBoldText} vào nội dung và tài liệu khóa học, ngay cả sau khi khóa học kết thúc"
                description="Bullet showcasing upgrade lifts access durations."
                values={{ fullAccessInBoldText }}
            />
        </li>
    );
};

// Must be child of a <ul className="fa-ul">
export const SupportMissionBullet = () => {
    const missionInBoldText = (
        <span className="font-weight-bold">
            <FormattedMessage
                id="learning.generic.upsell.supportMissionBullet.mission"
                defaultMessage="sứ mệnh"
                description="Bolded word 'mission', which is the bolded portion of a bullet point encouraging the learner to support the goals of the website."
            />
        </span>
    );
    return (
        <li className="upsell-bullet">
            <CheckmarkBullet />
            <FormattedMessage
                id="learning.generic.upsell.supportMissionBullet"
                defaultMessage="Hỗ trợ {missionInBoldText} của chúng tôi tại {siteName}"
                description="Bullet encouraging user to support edX's goals."
                values={{ missionInBoldText, siteName: getConfig().SITE_NAME }}
            />
        </li>
    );
};
