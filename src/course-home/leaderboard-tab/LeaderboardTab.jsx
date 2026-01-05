import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { camelCaseObject, getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { Alert, Container, Spinner } from '@openedx/paragon';

import StatCards from './StatCards';
import TopStudentsByGrade from './TopStudentsByGrade';
import TopStudentsByProgress from './TopStudentsByProgress';
import TopStudentsByStreak from './TopStudentsByStreak';
import TopStudentsByCoins from './TopStudentsByCoins';

const LeaderboardTab = () => {
  const { courseId } = useParams();
  const [summaryData, setSummaryData] = useState({
    totalStudents: 0,
    avgGrade: 0,
    maxGrade: 0,
    competingCount: 0,
    currentStreak: 0,
    bestStreak: 0,
  });
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Fetch summary data from top-grades API
  useEffect(() => {
    const fetchSummary = async () => {
      if (!courseId) {
        return;
      }

      setSummaryLoading(true);
      try {
        // Try XP summary first
        const xpUrl = `${getConfig().LMS_BASE_URL}/api/course_home/top-xp/${courseId}?limit=10`;
        let camelCased;
        try {
          const resp = await getAuthenticatedHttpClient().get(xpUrl);
          camelCased = camelCaseObject(resp.data);
          if (camelCased && camelCased.summary) {
            setSummaryData((prev) => ({
              ...prev,
              totalStudents: camelCased.summary.total_students || prev.totalStudents,
              avgGrade: camelCased.summary.avg_xp || prev.avgGrade,
              maxGrade: camelCased.summary.max_xp || prev.maxGrade,
              competingCount: camelCased.summary.top_count || prev.competingCount,
              currentStreak: prev.currentStreak,
              bestStreak: prev.bestStreak,
            }));
            setSummaryLoading(false);
            return;
          }
        } catch (err) {
          // xp endpoint may not exist; fall back to top-grades
        }

        // Fallback to top-grades summary
        const url = `${getConfig().LMS_BASE_URL}/api/course_home/top-grades/${courseId}?limit=10`;
        const { data } = await getAuthenticatedHttpClient().get(url);
        camelCased = camelCaseObject(data);

        if (camelCased && camelCased.summary) {
          setSummaryData((prev) => ({
            ...prev,
            totalStudents: camelCased.summary.totalStudents || prev.totalStudents,
            // avgGrade/maxGrade from grades are in scale of 10; keep them if no XP
            avgGrade: camelCased.summary.avgGrade || prev.avgGrade,
            maxGrade: camelCased.summary.maxGrade || prev.maxGrade,
            competingCount: camelCased.summary.topCount || prev.competingCount,
            currentStreak: prev.currentStreak,
            bestStreak: prev.bestStreak,
          }));
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[LeaderboardTab] Error fetching summary:', error);
      } finally {
        setSummaryLoading(false);
      }
    };

    fetchSummary();
  }, [courseId]);

  const { courseStatus } = useSelector((state) => state.courseHome);

  // Loading state managed by TabContainer
  if (courseStatus === 'loading' && summaryLoading) {
    return (
      <Container className="py-5 px-2 px-md-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang tải bảng xếp hạng...</p>
      </Container>
    );
  }

  // Show error state if data failed to load
  if (courseStatus === 'failed') {
    return (
      <Container className="py-5 px-2 px-md-4">
        <Alert variant="danger">
          <Alert.Heading>Không thể tải bảng xếp hạng</Alert.Heading>
          <p>Đã xảy ra lỗi khi tải dữ liệu bảng xếp hạng. Vui lòng thử lại sau.</p>
        </Alert>
      </Container>
    );
  }

  const handleStreakSummaryChange = useCallback(({ currentStreak, longestEverStreak }) => {
    setSummaryData((prev) => ({
      ...prev,
      currentStreak: currentStreak || 0,
      bestStreak: longestEverStreak || 0,
    }));
  }, []);

  return (
    <Container fluid className="py-4 px-3 px-md-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <StatCards
        totalStudents={summaryData.totalStudents}
        avgGrade={summaryData.avgGrade}
        maxGrade={summaryData.maxGrade}
        competingCount={summaryData.competingCount}
        currentStreak={summaryData.currentStreak}
        bestStreak={summaryData.bestStreak}
          />

      <div className="row">
        <div className="col-lg-4 col-md-6 mb-4">
          <TopStudentsByGrade courseId={courseId} />
        </div>

        <div className="col-lg-4 col-md-6 mb-4">
          <TopStudentsByCoins courseId={courseId} />
        </div>

        <div className="col-lg-4 col-md-6 mb-4">
          <TopStudentsByProgress courseId={courseId} />
        </div>
      </div>

      <div className="row mt-3">
        <div className="col-12 mb-4">
          <TopStudentsByStreak courseId={courseId} onSummaryChange={handleStreakSummaryChange} />
        </div>
      </div>
    </Container>
  );
};

export default LeaderboardTab;
