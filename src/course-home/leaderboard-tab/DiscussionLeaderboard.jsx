import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Card, Form, Button, Spinner } from '@openedx/paragon';
import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { camelCaseObject } from '@edx/frontend-platform';

function DiscussionLeaderboard({ courseId }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interactionType, setInteractionType] = useState('all');
  const [limit, setLimit] = useState(20);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // API endpoint for discussion leaderboard - adjust as needed
      const url = `${getConfig().LMS_BASE_URL}/api/custom/v1/leaderboard/discussions/${courseId}/?type=${interactionType}&limit=${limit}`;
      const { data } = await getAuthenticatedHttpClient().get(url);
      const camelCased = camelCaseObject(data);
      console.log('[DiscussionLeaderboard] Data:', camelCased);
      setStudents(camelCased.topStudents || camelCased.leaderboard || []);
    } catch (error) {
      console.error('[DiscussionLeaderboard] Error fetching data:', error);
      // Fallback empty data if API not available yet
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [courseId, interactionType, limit]);

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId, interactionType, limit, fetchData]);

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
            background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
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
            background: rank === 2 ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)' : 'linear-gradient(135deg, #ffc107 0%, #ffa000 100%)',
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
      <span
        className="text-muted font-weight-bold"
        style={{ fontSize: '0.9rem' }}
      >
        {rank}
      </span>
    );
  };

  const interactionOptions = [
    { value: 'all', label: 'All Interactions' },
    { value: 'posts', label: 'Posts' },
    { value: 'comments', label: 'Comments' },
    { value: 'votes', label: 'Votes' },
  ];

  return (
    <Card className="h-100 shadow-sm" style={{ borderRadius: '12px' }}>
      <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center py-3">
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '1.25rem' }} className="mr-2">💬</span>
          <span className="font-weight-bold" style={{ fontSize: '1rem' }}>Discussion Leaderboard</span>
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
            style={{ fontSize: '0.8rem' }}
          >
            ↻Refresh
          </Button>
        </div>
      </Card.Header>

      {!isCollapsed && (
        <Card.Body className="p-0">
          {/* Filter */}
          <div className="px-3 py-2 border-bottom bg-light">
            <div className="d-flex align-items-center flex-wrap">
              <Form.Control
                as="select"
                size="sm"
                value={interactionType}
                onChange={(e) => setInteractionType(e.target.value)}
                style={{ width: 'auto', fontSize: '0.85rem' }}
                className="mr-2"
              >
                {interactionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    💬 {option.label}
                  </option>
                ))}
              </Form.Control>
              <Form.Control
                as="select"
                size="sm"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                style={{ width: 'auto', fontSize: '0.85rem' }}
              >
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
                <option value={50}>Top 50</option>
              </Form.Control>
            </div>
          </div>

          {/* Table Header */}
          <div className="d-flex px-3 py-2 bg-light border-bottom" style={{ fontSize: '0.75rem', fontWeight: '600' }}>
            <div style={{ width: '60px' }}>RANK</div>
            <div className="flex-grow-1">USER</div>
            <div style={{ width: '80px', textAlign: 'right', color: '#f44336' }}>TOTAL</div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" />
              <span className="ml-2 text-muted">Đang tải...</span>
            </div>
          ) : (
            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {students.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  Chưa có dữ liệu thảo luận
                </div>
              ) : (
                students.map((student, index) => (
                  <div
                    key={student.userId || index}
                    className="d-flex align-items-center px-3 py-2 border-bottom"
                    style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}
                  >
                    <div className="mr-2" style={{ minWidth: '40px' }}>
                      {getRankBadge(student.rank || index + 1)}
                    </div>
                    <div className="flex-grow-1">
                      <div className="font-weight-semibold" style={{ fontSize: '0.9rem' }}>
                        {student.fullName || student.displayName}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        @{student.username}
                      </div>
                    </div>
                    <div
                      className="font-weight-bold text-right"
                      style={{
                        fontSize: '1rem',
                        color: '#4285f4',
                        minWidth: '60px',
                      }}
                    >
                      {student.totalInteractions || student.total || 0}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </Card.Body>
      )}
    </Card>
  );
}

DiscussionLeaderboard.propTypes = {
  courseId: PropTypes.string.isRequired,
};

export default DiscussionLeaderboard;

