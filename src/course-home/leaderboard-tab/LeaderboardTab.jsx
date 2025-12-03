import React from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { getConfig } from '@edx/frontend-platform';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { Alert, Container, Spinner } from '@openedx/paragon';
import { Info } from '@openedx/paragon/icons';

import { useModel } from '../../generic/model-store';
import LeaderboardTable from './LeaderboardTable';
import CurrentUserRank from './CurrentUserRank';
import TopPerformers from './TopPerformers';

function LeaderboardTab({ intl }) {
  const { courseId } = useParams();

  const leaderboardData = useModel('leaderboardTab', courseId);

  // Debug logging
  console.log('[LeaderboardTab] Raw leaderboardData:', leaderboardData);

  const {
    courseId: leaderboardCourseId,
    courseName,
    leaderboard = [],
    currentUserRank,
    totalStudents = 0,
    topPerformers = [],
  } = leaderboardData || {};

  console.log('[LeaderboardTab] Parsed data:', {
    courseName,
    leaderboardCount: leaderboard?.length,
    currentUserRank,
    totalStudents,
    topPerformersCount: topPerformers?.length,
  });

  const {
    courseStatus,
  } = useSelector(state => state.courseHome);

  // Loading state managed by TabContainer
  if (courseStatus === 'loading') {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang tải bảng xếp hạng...</p>
      </Container>
    );
  }

  // Show error state if data failed to load
  if (courseStatus === 'failed') {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Không thể tải bảng xếp hạng</Alert.Heading>
          <p>Đã xảy ra lỗi khi tải dữ liệu bảng xếp hạng. Vui lòng thử lại sau.</p>
        </Alert>
      </Container>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Container className="py-5">
        <Alert variant="info" icon={Info}>
          <Alert.Heading>Chưa có dữ liệu bảng xếp hạng</Alert.Heading>
          <p>
            Bảng xếp hạng sẽ xuất hiện khi học viên bắt đầu có điểm trong khóa học này.
          </p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5 leaderboard-tab">
      <h2 className="mb-4">{courseName || 'Course'} - Bảng xếp hạng</h2>

      {currentUserRank && currentUserRank.rank && (
        <CurrentUserRank
          rank={currentUserRank.rank}
          totalStudents={currentUserRank.totalStudents || totalStudents}
          percentile={currentUserRank.percentile || 0}
        />
      )}

      {topPerformers && Array.isArray(topPerformers) && topPerformers.length > 0 && (
        <TopPerformers topPerformers={topPerformers} />
      )}

      {leaderboard && Array.isArray(leaderboard) && leaderboard.length > 0 && (
        <LeaderboardTable
          leaderboard={leaderboard}
          totalStudents={totalStudents}
        />
      )}
    </Container>
  );
}

LeaderboardTab.propTypes = {
  intl: intlShape.isRequired,
};

export default injectIntl(LeaderboardTab);
