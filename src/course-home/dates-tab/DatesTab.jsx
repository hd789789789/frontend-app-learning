import React from 'react';
import { useSelector } from 'react-redux';
import { sendTrackEvent } from '@edx/frontend-platform/analytics';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Container, Row, Col, Card } from '@openedx/paragon';

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

  const {
    courseDateBlocks,
    datesBannerInfo,
    hasEnded,
    learnerIsFullAccess,
  } = useModel('dates', courseId);

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
        <Row className="mb-4">
          <Col lg={4} md={6} className="mb-3">
            <Card className="h-100 shadow-sm">
              <Card.Body>
                <Card.Title className="mb-1">Tổng số mốc thời gian</Card.Title>
                <Card.Subtitle className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>
                  Bao gồm tất cả mốc bắt đầu, kết thúc, thông báo, bài học,...
                </Card.Subtitle>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                  {courseDateBlocks.length}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={6} className="mb-3">
            <Card className="h-100 shadow-sm">
              <Card.Body>
                <Card.Title className="mb-1">Trạng thái khóa học</Card.Title>
                <Card.Subtitle className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>
                  Dựa trên thông tin has_ended trong API dates
                </Card.Subtitle>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {hasEnded ? 'Khóa học đã kết thúc' : 'Khóa học đang diễn ra'}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={6} className="mb-3">
            <Card className="h-100 shadow-sm">
              <Card.Body>
                <Card.Title className="mb-1">Tiến độ deadline</Card.Title>
                <Card.Subtitle className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>
                  Thông tin từ dates_banner_info.missed_deadlines
                </Card.Subtitle>
                <div
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: hasDeadlines ? '#dc2626' : '#16a34a',
                  }}
                >
                  {hasDeadlines ? 'Bạn đã bỏ lỡ một số hạn' : 'Bạn đang đúng tiến độ'}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Khu vực alert & gợi ý lịch học */}
      {isSelfPaced && hasDeadlines && (
        <Row className="mb-4">
          <Col lg={12}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <ShiftDatesAlert model="dates" fetch={fetchDatesTab} />
                <SuggestedScheduleHeader />
                <UpgradeToCompleteAlert logUpgradeLinkClick={logUpgradeLinkClick} />
                <UpgradeToShiftDatesAlert logUpgradeLinkClick={logUpgradeLinkClick} model="dates" />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Timeline được đóng khung giống nội dung chính ở các tab khác */}
      <Row>
        <Col lg={12}>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <Timeline />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DatesTab;
