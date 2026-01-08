import React from 'react';
import PropTypes from 'prop-types';
import { DataTable } from '@openedx/paragon';
import { formatDecimal } from './numberUtils';
// import { Trophy, Person } from '@openedx/paragon/icons'; // Icons don't exist in this version

const LeaderboardTable = ({ leaderboard, totalStudents }) => {
  const getRankBadge = (rank) => {
    if (rank === 1) { return <span className="text-warning">🥇 #{rank}</span>; }
    if (rank === 2) { return <span className="text-muted">🥈 #{rank}</span>; }
    if (rank === 3) { return <span className="text-muted">🥉 #{rank}</span>; }
    return <span className="text-muted">#{rank}</span>;
  };

  const columns = [
    {
      Header: 'Hạng',
      accessor: 'rank',
      Cell: ({ value }) => (
        <div className="font-weight-bold">
          {getRankBadge(value)}
        </div>
      ),
    },
    {
      Header: 'Học viên',
      accessor: 'displayName',
      Cell: ({ row }) => (
        <div>
          <div className={row.original.isCurrentUser ? 'font-weight-bold text-primary' : ''}>
            {row.original.displayName}
            {row.original.isCurrentUser && <span className="ml-2 badge badge-primary">Bạn</span>}
          </div>
          <small className="text-muted">@{row.original.username}</small>
        </div>
      ),
    },
    {
      Header: 'Tiến độ',
      accessor: 'gradePercent',
      Cell: ({ value, row }) => (
        <div>
            <div className="font-weight-bold">
            {formatDecimal(value ?? 0, 1)}%
          </div>
          {row.original.letterGrade && row.original.letterGrade.trim() && (
            <small className="text-muted">
              Điểm: {row.original.letterGrade}
            </small>
          )}
        </div>
      ),
    },
    {
      Header: 'Trạng thái',
      accessor: 'isPassing',
      Cell: ({ value }) => (
        <span className={`badge badge-${value ? 'success' : 'secondary'}`}>
          {value ? 'Đạt' : 'Chưa đạt'}
        </span>
      ),
    },
  ];

 

  return (
    <div className="leaderboard-table mt-4">
      <h3 className="mb-3">Tất cả học viên ({totalStudents})</h3>
      <DataTable
        data={leaderboard}
        columns={columns}
        itemCount={leaderboard.length}
        isPaginated
        defaultColumnValues={{ Filter: null }}
      >
        <DataTable.TableControlBar />
        <DataTable.Table />
        <DataTable.EmptyTable content="Không tìm thấy học viên nào" />
        {/* <DataTable.TableFooter /> */}
      </DataTable>
    </div>
  );
};

LeaderboardTable.propTypes = {
  leaderboard: PropTypes.arrayOf(
    PropTypes.shape({
      rank: PropTypes.number.isRequired,
      username: PropTypes.string.isRequired,
      displayName: PropTypes.string.isRequired,
      gradePercent: PropTypes.number.isRequired,
      letterGrade: PropTypes.string,
      isPassing: PropTypes.bool.isRequired,
      isCurrentUser: PropTypes.bool.isRequired,
    }),
  ).isRequired,
  totalStudents: PropTypes.number.isRequired,
};

export default LeaderboardTable;
