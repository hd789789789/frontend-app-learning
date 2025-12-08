import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '@openedx/paragon';
import './GroupStreaks.scss';

const GroupStreaks = ({ groups = [] }) => {
  // Mock data if empty
  const displayGroups = groups.length > 0 ? groups : [
    {
      id: 1,
      name: 'Nhóm Toán 7/3 THCS Trường Chinh 💪',
      streakDays: 5,
      members: [
        { id: 1, initial: 'A', color: '#E86C5D' },
        { id: 2, initial: 'B', color: '#3498DB' },
        { id: 3, initial: 'C', color: '#2ECC71' },
      ],
      additionalMembers: 5,
      status: 'in_progress',
      message: '💪 Tiếp tục học hôm nay để giữ chuỗi nhóm!',
    },
    {
      id: 2,
      name: 'Chinh phục Toán 7',
      streakDays: 10,
      members: [
        { id: 4, initial: 'D', color: '#8B3A62' },
        { id: 5, initial: 'E', color: '#E67E22' },
        { id: 6, initial: 'F', color: '#16A085' },
      ],
      additionalMembers: 2,
      status: 'all_completed',
      message: '✓ Tất cả thành viên đã học hôm nay',
    },
  ];

  return (
    <Card className="group-streaks-card">
      <Card.Body>
        <h3 className="group-streaks-title">👥 Chuỗi Nhóm của bạn</h3>
        
        {displayGroups.map((group) => (
          <div key={group.id} className="group-streak-item">
            <div className="group-streak-header">
              <div className="group-streak-name">{group.name}</div>
              <div className="group-streak-badge">
                <span className="streak-icon">🔥</span>
                <span className="streak-days">{group.streakDays} ngày</span>
              </div>
            </div>
            
            <div className="group-members">
              {group.members.map((member) => (
                <div
                  key={member.id}
                  className="member-avatar"
                  style={{ backgroundColor: member.color }}
                >
                  {member.initial}
                </div>
              ))}
              {group.additionalMembers > 0 && (
                <div className="member-avatar member-avatar-more">
                  +{group.additionalMembers}
                </div>
              )}
            </div>
            
            <div className={`group-streak-message ${group.status === 'all_completed' ? 'completed' : ''}`}>
              {group.message}
            </div>
          </div>
        ))}
      </Card.Body>
    </Card>
  );
};

GroupStreaks.propTypes = {
  groups: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    streakDays: PropTypes.number,
    members: PropTypes.array,
    additionalMembers: PropTypes.number,
    status: PropTypes.string,
    message: PropTypes.string,
  })),
};

GroupStreaks.defaultProps = {
  groups: [],
};

export default GroupStreaks;

