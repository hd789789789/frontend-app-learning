import React from 'react';
import { useSelector } from 'react-redux';
import { sendTrackEvent } from '@edx/frontend-platform/analytics';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Container } from '@openedx/paragon';

import messages from './messages';
import Timeline from './timeline/Timeline';

import { fetchDatesTab } from '../data';
import { useModel } from '../../generic/model-store';

import SuggestedScheduleHeader from '../suggested-schedule-messaging/SuggestedScheduleHeader';
import ShiftDatesAlert from '../suggested-schedule-messaging/ShiftDatesAlert';
import UpgradeToCompleteAlert from '../suggested-schedule-messaging/UpgradeToCompleteAlert';
import UpgradeToShiftDatesAlert from '../suggested-schedule-messaging/UpgradeToShiftDatesAlert';

const DatesTab = () => {
  const intl = useIntl();
  const {
    courseId,
  } = useSelector(state => state.courseHome);

  const {
    isSelfPaced,
    org,
  } = useModel('courseHomeMeta', courseId);

  const datesModel = useModel('dates', courseId) || {};
  const {
    courseDateBlocks,
    datesBannerInfo,
    hasEnded,
    learnerIsFullAccess,
  } = datesModel;

  const hasDeadlines = datesBannerInfo && datesBannerInfo.missedDeadlines;

  const logUpgradeLinkClick = () => {
    sendTrackEvent('edx.bi.ecommerce.upsell_links_clicked', {
      org_key: org,
      courserun_key: courseId,
      linkCategory: 'personalized_learner_schedules',
      linkName: 'dates_upgrade',
      linkType: 'button',
      pageName: 'dates_tab',
    });
  };

  return (
    <Container fluid className="py-4 px-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header đồng bộ với các tab khác */}
      <div className="d-flex align-items-center mb-4">
        <span style={{ fontSize: '2rem' }} className="mr-3">📅</span>
        <div>
          <h2 className="mb-0" style={{ fontWeight: 'bold' }}>
            {intl.formatMessage(messages.title)}
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
            Theo dõi các mốc quan trọng và hạn nộp trong khóa học
          </p>
        </div>
      </div>

      {/* Thẻ thông tin tổng quan, chỉ dùng dữ liệu chắc chắn có trong API dates */}
      {courseDateBlocks && courseDateBlocks.length > 0 && (
        <div className="row mb-4">
          <div className="col-lg-4 col-md-6 mb-3">
            <div className="h-100 shadow-sm border-0 bg-white rounded p-3">
              <h5 className="mb-1">Tổng số mốc thời gian</h5>
              <p className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>
                Bao gồm các mốc bắt đầu, kết thúc, thông báo và hoạt động quan trọng trong khóa học.
              </p>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                {courseDateBlocks.length}
              </div>
            </div>
          </div>

          <div className="col-lg-4 col-md-6 mb-3">
            <div className="h-100 shadow-sm border-0 bg-white rounded p-3">
              <h5 className="mb-1">Trạng thái khóa học</h5>
              <p className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>
                Cho bạn biết khóa học đang diễn ra hay đã kết thúc.
              </p>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {hasEnded ? 'Khóa học đã kết thúc' : 'Khóa học đang diễn ra'}
              </div>
            </div>
          </div>

          <div className="col-lg-4 col-md-6 mb-3">
            <div className="h-100 shadow-sm border-0 bg-white rounded p-3">
              <h5 className="mb-1">Tiến độ deadline</h5>
              <p className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>
                Tình trạng bám sát các hạn nộp bài trong khóa học.
              </p>
              <div
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: hasDeadlines ? '#dc2626' : '#16a34a',
                }}
              >
                {hasDeadlines ? 'Bạn đã bỏ lỡ một vài hạn nộp, hãy xem lại kế hoạch học.' : 'Bạn đang đúng tiến độ học tập, hãy tiếp tục phát huy!'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Khu vực alert & gợi ý lịch học */}
      {isSelfPaced && hasDeadlines && (
        <div className="row mb-4">
          <div className="col-lg-12">
            <div className="shadow-sm border-0 bg-white rounded p-3">
              <ShiftDatesAlert model="dates" fetch={fetchDatesTab} />
              <SuggestedScheduleHeader />
              <UpgradeToCompleteAlert logUpgradeLinkClick={logUpgradeLinkClick} />
              <UpgradeToShiftDatesAlert logUpgradeLinkClick={logUpgradeLinkClick} model="dates" />
            </div>
          </div>
        </div>
      )}

      {/* Timeline được đóng khung giống nội dung chính ở các tab khác */}
      <div className="row">
        <div className="col-lg-12">
          <div className="shadow-sm border-0 bg-white rounded p-3">
            <Timeline />
          </div>
        </div>
      </div>
    </Container>
  );
};

export default DatesTab;
