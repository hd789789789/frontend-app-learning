import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Card, Form, Button, Spinner } from '@openedx/paragon';
import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { camelCaseObject } from '@edx/frontend-platform';

function TopStudentsByGrade({ courseId }) {
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(10);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Sử dụng API mới: /api/course_home/top-grades/{courseId}
      const url = `${getConfig().LMS_BASE_URL}/api/course_home/top-grades/${courseId}?limit=${limit}`;
      const { data } = await getAuthenticatedHttpClient().get(url);
      const camelCased = camelCaseObject(data);
      console.log('[TopStudentsByGrade] Data:', camelCased);
      setStudents(camelCased.topStudents || []);
      setSummary(camelCased.summary || {});
    } catch (error) {
      console.error('[TopStudentsByGrade] Error fetching data:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [courseId, limit]);

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId, limit, fetchData]);

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

  return (
    <Card className="h-100 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
      {/* Header với title rõ ràng */}
      <div 
        className="d-flex justify-content-between align-items-center px-3 py-3"
        style={{ 
          backgroundColor: '#fff',
          borderBottom: '1px solid #dee2e6'
        }}
      >
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '1.25rem' }} className="mr-2">🏆</span>
          <span className="font-weight-bold" style={{ fontSize: '1.1rem', color: '#333' }}>
            Top Điểm Số
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
            style={{ fontSize: '0.8rem' }}
          >
            ↻Tải lại
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <Card.Body className="p-0">
          {/* Filter */}
          <div className="px-3 py-2 border-bottom bg-light">
            <div className="d-flex align-items-center">
              <span className="text-muted mr-2" style={{ fontSize: '0.85rem' }}>Hiển thị:</span>
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
                        color: '#f57c00',
                      }}
                    >
                      {student.gradePercentage?.toFixed(1) || student.gradePercent?.toFixed(1) || 0}%
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

TopStudentsByGrade.propTypes = {
  courseId: PropTypes.string.isRequired,
};

export default TopStudentsByGrade;

