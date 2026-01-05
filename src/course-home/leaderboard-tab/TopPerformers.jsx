import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '@openedx/paragon';
// import { Trophy } from '@openedx/paragon/icons'; // Trophy doesn't exist in this Paragon version

function TopPerformers({ topPerformers }) {
  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  const getMedalClass = (rank) => {
    if (rank === 1) return 'border-warning';
    if (rank === 2) return 'border-secondary';
    if (rank === 3) return 'border-info';
    return '';
  };

 

  return (
    <div className="top-performers mb-4">
      <h3 className="mb-3">
        <span className="mr-2">🏆</span>
        Top 3 xuất sắc nhất
      </h3>
      <div className="row">
        {topPerformers.map((student, index) => (
          <div key={student.userId || student.username || index} className="col-md-4 mb-3">
            <Card className={`h-100 shadow-sm ${getMedalClass(student.rank)}`} style={{ borderWidth: '2px' }}>
              <Card.Body className="text-center">
                <div className="display-3 mb-2">{getMedalEmoji(student.rank)}</div>
                <div className="h5 font-weight-bold mb-1">
                  {student.displayName}
                  {student.isCurrentUser && <span className="ml-2 badge badge-primary">Bạn</span>}
                </div>
                <div className="text-muted mb-2">@{student.username}</div>
                <div className="display-4 font-weight-bold text-primary mb-2">
                  {(student.gradePercent || 0).toFixed(1)}%
                </div>
                <div className="text-muted small">Tiến độ hoàn thành</div>
                {student.letterGrade && student.letterGrade.trim() && (
                  <div className="badge badge-success badge-lg mt-2">
                    Điểm: {student.letterGrade}
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

TopPerformers.propTypes = {
  topPerformers: PropTypes.arrayOf(
    PropTypes.shape({
      rank: PropTypes.number.isRequired,
      userId: PropTypes.number.isRequired,
      username: PropTypes.string.isRequired,
      displayName: PropTypes.string.isRequired,
      gradePercent: PropTypes.number.isRequired,
      letterGrade: PropTypes.string,
      isPassing: PropTypes.bool.isRequired,
      isCurrentUser: PropTypes.bool.isRequired,
    })
  ).isRequired,
};

export default TopPerformers;