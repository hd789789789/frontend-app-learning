import React, { useMemo, useState } from 'react';
import { Badge, Container, ProgressBar } from '@openedx/paragon';

import './StudyGroupsTab.scss';

// Mock data modeled closely after the provided HTML reference
const GROUPS_MOCK = [
  {
    id: 'group1',
    name: 'Nhóm Toán 7/3 THCS Trường Chinh 💪',
    members: 8,
    streak: 5,
    progress: 72,
    description: 'Nhóm học cùng nhau để cùng tiến bộ! Hãy cùng hoàn thành mục tiêu tuần này.',
    membersList: [
      { name: 'An Nhiên', initials: 'A', color: '#E86C5D', streak: 5, progress: 85 },
      { name: 'Bảo Trâm', initials: 'B', color: '#3498DB', streak: 5, progress: 78 },
      { name: 'Pi (Bạn) 👑', initials: 'PI', color: '#2ECC71', streak: 12, progress: 67, role: 'Admin' },
      { name: 'Đức Anh', initials: 'D', color: '#F39C12', streak: 3, progress: 65 },
    ],
    posts: [
      {
        id: 'p1',
        author: 'An Nhiên',
        initials: 'A',
        color: '#E86C5D',
        time: '30 phút trước • 👥 Nhóm',
        content: 'Mình vừa hoàn thành bài kiểm tra Chương 1 và đạt 9.5 điểm! 🎉 Cảm ơn mọi người đã động viên và giúp đỡ mình trong nhóm. Ai còn khó khăn phần nào cứ hỏi mình nhé! 💪',
        reactions: 24,
        comments: 8,
      },
      {
        id: 'p2',
        author: 'Đức Anh',
        initials: 'D',
        color: '#F39C12',
        time: '2 giờ trước • 👥 Nhóm',
        content: 'Ai giải thích giúp mình phần "Lũy thừa của số hữu tỉ" được không? Mình hơi khó hiểu phần này 🤔',
        reactions: 12,
        comments: 15,
      },
      {
        id: 'p3',
        author: 'Pi (Bạn) 👑 Admin',
        initials: 'PI',
        color: '#2ECC71',
        time: 'Hôm qua • 👥 Nhóm',
        content: '🎯 Nhóm của chúng ta đã duy trì chuỗi 5 ngày! Tuyệt vời! Hãy tiếp tục phấn đấu để đạt mục tiêu 10 ngày liên tiếp nhé các bạn! 💪🔥\n\nMọi người nhớ hoàn thành bài học hôm nay để giữ chuỗi nhóm nhé! Cùng nhau tiến bộ! 🚀',
        reactions: 18,
        comments: 5,
      },
    ],
  },
  {
    id: 'group2',
    name: 'Nhóm Toán 8/1 THCS Lê Quý Đôn 🚀',
    members: 6,
    streak: 8,
    progress: 85,
    description: 'Nhóm học tập chăm chỉ! Cùng nhau chinh phục các đỉnh cao toán học 🎯',
    membersList: [
      { name: 'Kim Ngân', initials: 'K', color: '#9B59B6', streak: 8, progress: 92 },
      { name: 'Thành Long', initials: 'T', color: '#16A085', streak: 8, progress: 88 },
      { name: 'Pi (Bạn)', initials: 'PI', color: '#2ECC71', streak: 12, progress: 67, role: 'Thành viên' },
      { name: 'Văn Minh', initials: 'V', color: '#E67E22', streak: 6, progress: 81 },
      { name: 'Hồng Anh', initials: 'H', color: '#3498DB', streak: 8, progress: 86 },
      { name: 'Ngọc Hân 👑', initials: 'N', color: '#E74C3C', streak: 8, progress: 90, role: 'Admin' },
    ],
    posts: [
      {
        id: 'p4',
        author: 'Kim Ngân',
        initials: 'K',
        color: '#9B59B6',
        time: '1 giờ trước • 👥 Nhóm',
        content: 'Nhóm mình đang dẫn đầu bảng xếp hạng rồi! Cùng cố gắng duy trì vị trí top 1 nhé các bạn! 💪✨',
        reactions: 20,
        comments: 4,
      },
    ],
  },
];

const MemberRow = ({ member }) => (
  <div className="member-row">
    <div className="member-info">
      <div className="member-avatar" style={{ background: member.color }}>{member.initials}</div>
      <div>
        <div className="member-name">{member.name}</div>
        <div className="member-sub">🔥 {member.streak} ngày • {member.progress}%</div>
      </div>
    </div>
    <div className="member-actions">
      {member.role ? (
        <span className="member-badge">{member.role}</span>
      ) : (
        <>
          <button className="friend-action-btn" title="Xem profile">👁️</button>
          <button className="friend-action-btn" title="Xóa khỏi nhóm">🗑️</button>
        </>
      )}
    </div>
  </div>
);

const PostCard = ({ post }) => (
  <div className="feed-post">
    <div className="post-header">
      <div className="user-avatar" style={{ background: post.color }}>{post.initials}</div>
      <div className="post-author-info">
        <div className="post-author-name">{post.author}</div>
        <div className="post-time">{post.time}</div>
      </div>
      <button className="icon-button" title="Tùy chọn">⋯</button>
    </div>
    <div className="post-content">
      {post.content}
    </div>
    <div className="post-reactions">
      <button className="reaction-btn liked">
        <span className="reaction-icon">❤️</span>
        <span>{post.reactions}</span>
      </button>
      <button className="reaction-btn">
        <span>💬</span>
        <span>{post.comments} bình luận</span>
      </button>
      <button className="reaction-btn">
        <span>📤</span>
        <span>Chia sẻ</span>
      </button>
    </div>
    <div className="comment-input-wrapper">
      <div className="user-avatar small">PI</div>
      <input type="text" className="comment-input" placeholder="Viết bình luận..." />
      <button className="send-comment-btn">Gửi</button>
    </div>
  </div>
);

const GroupCard = ({ group }) => {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed(prev => !prev);

  return (
    <div className={`group-card ${collapsed ? 'collapsed' : ''}`}>
      <div className="group-header">
        <button className="group-collapse-toggle" onClick={toggle} title="Thu gọn/Mở rộng nhóm">
          {collapsed ? '▶' : '▼'}
        </button>
        <div className="group-info">
          <h3>{group.name}</h3>
          <div className="group-stats">
            <span>👥 {group.members} thành viên</span>
            <span>🔥 Chuỗi nhóm: {group.streak} ngày</span>
            <span>📊 Tiến độ TB: {group.progress}%</span>
          </div>
        </div>
        <div className="group-menu-container">
          <button className="group-menu-btn" title="Tùy chọn nhóm">⋮</button>
        </div>
      </div>

      {collapsed && (
        <div className="collapsed-group-summary">
          <div className="collapsed-stat">
            <span>👥</span>
            <strong>{group.members}</strong>
            <span>thành viên</span>
          </div>
          <div className="collapsed-stat">
            <span>🔥</span>
            <strong>{group.streak} ngày</strong>
          </div>
          <div className="collapsed-stat">
            <span>📊</span>
            <strong>{group.progress}%</strong>
            <span>tiến độ</span>
          </div>
        </div>
      )}

      {!collapsed && (
        <>
          <div className="group-subtitle">
            {group.description}
          </div>

          <div className="members-block">
            <div className="members-head">
              <span>Thành viên ({group.members})</span>
              <button className="btn btn-primary btn-sm">+ Thêm</button>
            </div>
            <div className="members-list">
              {group.membersList.map(member => (
                <MemberRow key={member.name} member={member} />
              ))}
            </div>
            <div className="member-more">Xem thêm thành viên...</div>
          </div>

          <div className="discussion-actions">
            <button className="btn btn-primary w-100">💬 Thảo luận</button>
          </div>

          <div className="discussion-container">
            <div className="create-post-box">
              <div className="create-post-input">
                <div className="user-avatar">PI</div>
                <textarea className="create-post-textarea" placeholder="Chia sẻ suy nghĩ của bạn với nhóm..." rows="1" />
              </div>
              <div className="create-post-actions">
                <button className="post-action-btn" title="Thêm ảnh">📷</button>
                <button className="post-action-btn" title="Thêm file">📎</button>
                <button className="post-action-btn" title="Thêm emoji">😊</button>
                <button className="btn btn-primary post-submit">Đăng</button>
              </div>
            </div>

            <div className="discussion-feed">
              {group.posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const StudyGroupsTab = () => {
  const groups = useMemo(() => GROUPS_MOCK, []);

  return (
    <Container className="study-groups-tab px-0">
      <div className="groups-header">
        <h2>Nhóm học tập</h2>
        <button className="btn btn-primary">+ Tạo nhóm mới</button>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h3>Nhóm của bạn</h3>
        </div>
        <div className="group-list">
          {groups.map(group => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      </section>
    </Container>
  );
};

export default StudyGroupsTab;


