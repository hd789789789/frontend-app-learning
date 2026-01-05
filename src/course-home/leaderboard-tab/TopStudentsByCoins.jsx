import React, {
  useState, useEffect, useCallback, useRef,
} from 'react';
import PropTypes from 'prop-types';
import {
  Card, Form, Button, Spinner,
} from '@openedx/paragon';
import { getConfig, camelCaseObject } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getLeaderboardTabData } from '../data/api';

// CSS styles for hover animation and sticky
const hoverStyles = `
  .leaderboard-row-hover {
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    cursor: pointer;
  }
  .leaderboard-row-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 1;
  }
  .sticky-user-row-top {
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: #fff7e6 !important;
    border-bottom: 2px solid #f57c00;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  .sticky-user-row-bottom {
    position: sticky;
    bottom: 0;
    z-index: 10;
    background-color: #fff7e6 !important;
    border-top: 2px solid #f57c00;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
    transition: opacity 0.3s ease, transform 0.3s ease;
    margin-top: auto;
  }
`;

const TopStudentsByCoins = ({ courseId }) => {
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(10);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUserEntry, setCurrentUserEntry] = useState(null);
  const [showStickyUser, setShowStickyUser] = useState(false);
  const [stickyPosition, setStickyPosition] = useState('top');
  const [testMode, setTestMode] = useState(false);
  const scrollContainerRef = useRef(null);
  const userRowRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const testParam = testMode ? '&test=true' : '';
      // Try dedicated endpoint first (may not exist). If it fails, fall back to the general leaderboard endpoint.
      let camelCased;
      try {
        const url = `${getConfig().LMS_BASE_URL}/api/course_home/top-coins/${courseId}?limit=${limit}${testParam}`;
        const { data } = await getAuthenticatedHttpClient().get(url);
        camelCased = camelCaseObject(data);
      } catch (err) {
        // Fallback to leaderboard tab data and try to extract coin/xu leaderboard there
        const data = await getLeaderboardTabData(courseId);
        camelCased = data || {};
      }

      // The API might expose coin leaderboards under several possible keys.
      const possibleLists = [
        camelCased.topCoins,
        camelCased.top_xu,
        camelCased.top_coins,
        camelCased.coinsLeaderboard,
        camelCased.coins_leaderboard,
        camelCased.topStudents,
      ];
      const topStudents = possibleLists.find((list) => Array.isArray(list) && list.length > 0) || [];
      setSummary(camelCased.summary || {});

      const currentUserInTop = topStudents.find((s) => s.isCurrentUser);
      const currentUserFromApi = camelCased.currentUserEntry || null;
      const currentUser = currentUserInTop || currentUserFromApi || null;
      setCurrentUserEntry(currentUser);

      setStudents(topStudents);
      setShowStickyUser(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[TopStudentsByCoins] Error fetching data:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [courseId, limit, testMode]);

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId, limit, testMode, fetchData]);

  const isUserInList = students.some((s) => s.isCurrentUser);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const userRow = userRowRef.current;

    if (!container || !currentUserEntry) {
      setShowStickyUser(false);
      return;
    }

    if (!isUserInList) {
      setShowStickyUser(true);
      setStickyPosition('bottom');
      return;
    }

    if (!userRow) {
      setShowStickyUser(false);
      return;
    }

    const handleScroll = () => {
      if (!userRow) {
        if (!isUserInList && currentUserEntry) {
          setShowStickyUser(true);
          setStickyPosition('bottom');
        } else {
          setShowStickyUser(false);
        }
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const userRowRect = userRow.getBoundingClientRect();
      const isUserRowVisible = userRowRect.top >= containerRect.top && userRowRect.bottom <= containerRect.bottom;

      if (isUserRowVisible) {
        setShowStickyUser(false);
      } else {
        setShowStickyUser(true);
        if (userRowRect.top < containerRect.top) {
          setStickyPosition('top');
        } else {
          setStickyPosition('bottom');
        }
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    const timeoutId = setTimeout(handleScroll, 100);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [currentUserEntry, students, isUserInList]);

  const handleRefresh = () => {
    fetchData();
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span
          className="d-inline-flex align-items-center justify-content-center"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #ffd700 0%, #ffb300 100%)',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '0.85rem',
          }}
        >
          {rank}
        </span>
      );
    }
    if (rank <= 3) {
      return (
        <span
          className="d-inline-flex align-items-center justify-content-center"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background:
              rank === 2
                ? 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)'
                : 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '0.85rem',
          }}
        >
          {rank}
        </span>
      );
    }
    return (
      <span className="text-muted font-weight-bold" style={{ fontSize: '0.9rem' }}>
        {rank}
      </span>
    );
  };

  const extractCoinValue = (student) =>
    // Support multiple possible fields returned from backend
    student.coins ?? student.coinsEarned ?? student.coinBalance ?? student.coins_balance ?? 0;
  return (
    <>
      <style>{hoverStyles}</style>
      <Card className="h-100 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div
          className="d-flex justify-content-between align-items-center px-3 py-3"
          style={{
            backgroundColor: '#fff',
            borderBottom: '1px solid #dee2e6',
          }}
        >
          <div className="d-flex align-items-center">
            <span style={{ fontSize: '1.25rem' }} className="mr-2">
              💰
            </span>
            <span className="font-weight-bold" style={{ fontSize: '1.1rem', color: '#333' }}>
              Top Xu
            </span>
          </div>
          <div className="d-flex align-items-center">
            <Button
              variant="link"
              size="sm"
              className="p-1 text-muted"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? '▼' : '▲'}
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleRefresh}
              className="ml-2"
              style={{ fontSize: '1rem', padding: '0.25rem 0.5rem' }}
              title="Tải lại"
            >
              ↻
            </Button>
          </div>
        </div>

        {!isCollapsed && (
        <Card.Body className="p-0">
          <div className="px-3 py-2 border-bottom bg-light">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <span className="text-muted mr-2" style={{ fontSize: '0.85rem' }}>
                  Hiển thị:
                </span>
                <Form.Control
                  as="select"
                  size="sm"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  style={{ width: 'auto', fontSize: '0.85rem' }}
                >
                  <option value={5}>Top 5</option>
                  <option value={10}>Top 10</option>
                  <option value={20}>Top 20</option>
                  <option value={50}>Top 50</option>
                </Form.Control>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" />
              <span className="ml-2 text-muted">Đang tải...</span>
            </div>
          ) : (
            <div
              ref={scrollContainerRef}
              style={{
                maxHeight: '400px',
                overflowY: 'auto',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {students.length === 0 ? (
                <div className="text-center py-4 text-muted">Chưa có dữ liệu</div>
              ) : (
                <>
                  {currentUserEntry && showStickyUser && stickyPosition === 'top' && (
                  <div className="d-flex align-items-center px-3 py-2 sticky-user-row-top" style={{ backgroundColor: '#fff7e6' }}>
                    <div className="mr-3" style={{ minWidth: '35px' }}>
                      {getRankBadge(currentUserEntry.rank)}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center" style={{ fontSize: '0.9rem' }}>
                        <span className="font-weight-semibold">
                          {currentUserEntry.fullName || currentUserEntry.displayName}
                        </span>
                        <span
                          className="ml-2 px-2 py-0"
                          style={{
                            backgroundColor: '#f57c00', color: '#fff', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 'bold',
                          }}
                        >
                          Bạn
                        </span>
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        @{currentUserEntry.username}
                      </div>
                    </div>
                    <div className="font-weight-bold" style={{ fontSize: '1rem', color: '#f57c00' }}>
                      {extractCoinValue(currentUserEntry)}
                                                    &nbsp;xu
                    </div>
                  </div>
                  )}

                  <div style={{ flex: '1 1 auto' }}>
                    {students.map((student, index) => {
                      const { isCurrentUser } = student;
                      const coinValue = extractCoinValue(student);
                      return (
                        <div
                          key={student.userId || index}
                          ref={isCurrentUser ? userRowRef : null}
                          className="d-flex align-items-center px-3 py-2 border-bottom leaderboard-row-hover"
                          style={{
                            backgroundColor: isCurrentUser ? '#fff7e6' : index % 2 === 0 ? '#fff' : '#f9f9f9',
                          }}
                        >
                          <div className="mr-3" style={{ minWidth: '35px' }}>
                            {getRankBadge(student.rank)}
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center" style={{ fontSize: '0.9rem' }}>
                              <span className="font-weight-semibold">
                                {student.fullName || student.displayName}
                              </span>
                              {isCurrentUser && (
                              <span
                                className="ml-2 px-2 py-0"
                                style={{
                                  backgroundColor: '#f57c00', color: '#fff', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 'bold',
                                }}
                              >
                                Bạn
                              </span>
                              )}
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                              @{student.username}
                            </div>
                          </div>
                          <div className="font-weight-bold" style={{ fontSize: '1rem', color: '#f57c00' }}>
                            {coinValue}
                                                            &nbsp;xu
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {currentUserEntry && showStickyUser && stickyPosition === 'bottom' && (
                  <div className="d-flex align-items-center px-3 py-2 sticky-user-row-bottom" style={{ backgroundColor: '#fff7e6' }}>
                    <div className="mr-3" style={{ minWidth: '35px' }}>
                      {getRankBadge(currentUserEntry.rank)}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center" style={{ fontSize: '0.9rem' }}>
                        <span className="font-weight-semibold">
                          {currentUserEntry.fullName || currentUserEntry.displayName}
                        </span>
                        <span
                          className="ml-2 px-2 py-0"
                          style={{
                            backgroundColor: '#f57c00', color: '#fff', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 'bold',
                          }}
                        >
                          Bạn
                        </span>
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        @{currentUserEntry.username}
                      </div>
                    </div>
                    <div className="font-weight-bold" style={{ fontSize: '1rem', color: '#f57c00' }}>
                      {extractCoinValue(currentUserEntry)}
                                                    &nbsp;xu
                    </div>
                  </div>
                  )}
                </>
              )}
            </div>
          )}
        </Card.Body>
        )}
      </Card>
    </>
  );
};

TopStudentsByCoins.propTypes = {
  courseId: PropTypes.string.isRequired,
};

export default TopStudentsByCoins;
