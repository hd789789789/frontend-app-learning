import React from 'react';
import { formatDecimal } from './numberUtils';
import PropTypes from 'prop-types';

function LeaderboardTableSimple({ leaderboard, totalStudents }) {

  return (
    <div className="leaderboard-table mt-4">
      <h3 className="mb-3">Tất cả học viên ({totalStudents})</h3>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Hạng</th>
            <th>Học viên</th>
            <th>Tiến độ</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((student, index) => (
            <tr key={student.userId || index} className={student.isCurrentUser ? 'table-primary' : ''}>
              <td>{student.rank}</td>
              <td>
                <div>{student.displayName}</div>
                <small className="text-muted">@{student.username}</small>
              </td>
              <td>{formatDecimal(student?.gradePercent ?? 0, 1)}%</td>
              <td>
                <span className={`badge badge-${student.isPassing ? 'success' : 'secondary'}`}>
                  {student.isPassing ? 'Đạt' : 'Chưa đạt'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

LeaderboardTableSimple.propTypes = {
  leaderboard: PropTypes.arrayOf(
    PropTypes.shape({
      rank: PropTypes.number.isRequired,
      userId: PropTypes.number,
      username: PropTypes.string.isRequired,
      displayName: PropTypes.string.isRequired,
      gradePercent: PropTypes.number.isRequired,
      isPassing: PropTypes.bool.isRequired,
      isCurrentUser: PropTypes.bool.isRequired,
    })
  ).isRequired,
  totalStudents: PropTypes.number.isRequired,
};

export default LeaderboardTableSimple;
