import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { getConfig } from '@edx/frontend-platform';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { Alert, Container } from '@openedx/paragon';
import { Info } from '@openedx/paragon/icons';

import { fetchLeaderboardTab } from '../data';
import { useModel } from '../../generic/model-store';
import LeaderboardTable from './LeaderboardTable';
import CurrentUserRank from './CurrentUserRank';
import TopPerformers from './TopPerformers';

function LeaderboardTab({ intl }) {
  const { courseId } = useParams();
  const dispatch = useDispatch();

  const {
    courseId: leaderboardCourseId,
    courseName,
    leaderboard,
    currentUserRank,
    totalStudents,
    topPerformers,
  } = useModel('leaderboardTab', courseId);

  const {
    courseStatus,
  } = useSelector(state => state.courseHome);

  useEffect(() => {
    dispatch(fetchLeaderboardTab(courseId));
  }, [courseId, dispatch]);

  if (courseStatus !== 'loaded') {
    return null;
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Container className="py-5">
        <Alert variant="info" icon={Info}>
          <Alert.Heading>No leaderboard data available</Alert.Heading>
          <p>
            The leaderboard will appear once students start earning grades in this course.
          </p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5 leaderboard-tab">
      <h2 className="mb-4">{courseName} - Leaderboard</h2>

      {currentUserRank && (
        <CurrentUserRank
          rank={currentUserRank.rank}
          totalStudents={currentUserRank.totalStudents}
          percentile={currentUserRank.percentile}
        />
      )}

      {topPerformers && topPerformers.length > 0 && (
        <TopPerformers topPerformers={topPerformers} />
      )}

      <LeaderboardTable
        leaderboard={leaderboard}
        totalStudents={totalStudents}
      />
    </Container>
  );
}

LeaderboardTab.propTypes = {
  intl: intlShape.isRequired,
};

export default injectIntl(LeaderboardTab);
