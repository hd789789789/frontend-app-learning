import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Card, Form, Button, Spinner } from '@openedx/paragon';
import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { camelCaseObject } from '@edx/frontend-platform';

function TopStudentsByProgress({ courseId }) {
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [limit, setLimit] = useState(10);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const url = `${getConfig().LMS_BASE_URL}/api/custom/v1/leaderboard/top-progress/${courseId}/?period=${period}&limit=${limit}`;
      const { data } = await getAuthenticatedHttpClient().get(url);
      const camelCased = camelCaseObject(data);
      console.log('[TopStudentsByProgress] Data:', camelCased);
      setStudents(camelCased.topStudents || []);
      setSummary(camelCased.summary || {});
    } catch (error) {
      console.error('[TopStudentsByProgress] Error fetching data:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [courseId, period, limit]);

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId, period, limit, fetchData]);

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
            background: rank === 2 ? 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)' : 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)',
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

  const periodButtons = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <Card className="h-100 shadow-sm" style={{ borderRadius: '12px' }}>
      <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center py-3">
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '1.25rem' }} className="mr-2">⚡</span>
          <span className="font-weight-bold" style={{ fontSize: '1rem' }}>Top Students by Progress</span>
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
          {/* Filter - Period buttons and limit dropdown */}
          <div className="px-3 py-2 border-bottom bg-light">
            <div className="d-flex align-items-center flex-wrap">
              <div className="btn-group mr-3" role="group">
                {periodButtons.map((btn) => (
                  <button
                    key={btn.value}
                    type="button"
                    className={`btn btn-sm ${period === btn.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setPeriod(btn.value)}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
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

          {/* Content */}
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" />
              <span className="ml-2 text-muted">Đang tải...</span>
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {students.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  Chưa có dữ liệu
                </div>
              ) : (
                students.map((student, index) => (
                  <div
                    key={student.userId || index}
                    className="d-flex align-items-center px-3 py-2 border-bottom"
                    style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}
                  >
                    <div className="mr-3" style={{ minWidth: '35px' }}>
                      {getRankBadge(student.rank)}
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
                      className="font-weight-bold"
                      style={{
                        fontSize: '1rem',
                        color: '#4caf50',
                      }}
                    >
                      {student.progressPercent?.toFixed(1) || 0}%
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

TopStudentsByProgress.propTypes = {
  courseId: PropTypes.string.isRequired,
};

export default TopStudentsByProgress;

