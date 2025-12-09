import React, { useMemo, useState } from 'react';
import {
  Badge,
  Container,
  ProgressBar,
  Row,
  Col,
} from '@openedx/paragon';

import { useParams } from 'react-router-dom';
import { useModel } from '../../generic/model-store';
import StreakCalendar from '../welcome-tab/StreakCalendar';
import GroupStreaks from '../welcome-tab/GroupStreaks';
import StudyTip from '../welcome-tab/StudyTip';
import ReferralWidget from '../welcome-tab/ReferralWidget';
import './StudyGroupsTab.scss';

const GROUPS_MOCK = [
  {
    id: 'g1',
    name: 'Nhóm Toán 7/3 THCS Trường Chinh',
    description: 'Nhóm học cùng nhau để cùng tiến bộ. Đặt mục tiêu tuần và chia sẻ tips ôn tập.',
    members: 8,
    streak: 5,
    progress: 72,
    weeklyGoal: { current: 5, total: 7 },
    tags: ['Chăm chỉ', 'Thi giữa kỳ 12/12', 'Mục tiêu: 7/10 bài'],
    featuredMembers: [
      { name: 'An Nhiên', initials: 'A', color: '#e86c5d', progress: 85, streak: 5, role: 'Mod' },
      { name: 'Bảo Trâm', initials: 'B', color: '#3498db', progress: 78, streak: 5 },
      { name: 'Pi (Bạn)', initials: 'PI', color: '#2ecc71', progress: 67, streak: 12, role: 'Admin' },
    ],
    posts: [
      {
        id: 'p1',
        author: 'An Nhiên',
        initials: 'A',
        color: '#e86c5d',
        time: '30 phút trước',
        summary: 'Vừa hoàn thành kiểm tra Chương 1 đạt 9.5 điểm, ai cần tips ôn tập thì comment nhé!',
        reactions: 24,
        comments: 8,
      },
      {
        id: 'p2',
        author: 'Đức Anh',
        initials: 'D',
        color: '#f39c12',
        time: '2 giờ trước',
        summary: 'Cần người giải thích phần Lũy thừa của số hữu tỉ, ai rảnh hỗ trợ giúp mình với.',
        reactions: 12,
        comments: 15,
      },
    ],
  },
  {
    id: 'g2',
    name: 'CLB Giải đề toán tốc chiến',
    description: 'Chia sẻ bộ đề, giải nhanh cùng đồng đội và tổng kết sau mỗi buổi.',
    members: 12,
    streak: 9,
    progress: 81,
    weeklyGoal: { current: 4, total: 6 },
    tags: ['Đề thi thử', 'Chia sẻ file', 'Buổi tối 20:00'],
    featuredMembers: [
      { name: 'Minh Khôi', initials: 'M', color: '#8e44ad', progress: 92, streak: 14 },
      { name: 'Linh Chi', initials: 'L', color: '#1abc9c', progress: 79, streak: 6 },
      { name: 'Hữu Phúc', initials: 'H', color: '#e67e22', progress: 70, streak: 3 },
    ],
    posts: [
      {
        id: 'p3',
        author: 'Minh Khôi',
        initials: 'M',
        color: '#8e44ad',
        time: 'Hôm qua',
        summary: 'Upload bộ đề thi thử số 02, tối nay 20:00 cùng chữa nhé.',
        reactions: 31,
        comments: 10,
      },
    ],
  },
];

const QuickStat = ({ icon, label, value, tone }) => (
  <div className={`quick-stat ${tone || ''}`}>
    <div className="quick-stat-icon">{icon}</div>
    <div className="quick-stat-body">
      <div className="quick-stat-label">{label}</div>
      <div className="quick-stat-value">{value}</div>
    </div>
  </div>
);

const MemberChip = ({ member }) => (
  <div className="member-chip">
    <div className="member-avatar" style={{ background: member.color }}>
      {member.initials}
    </div>
    <div className="member-meta">
      <div className="member-name">
        {member.name}
        {member.role && <Badge variant="light" className="ms-2">{member.role}</Badge>}
      </div>
      <div className="member-sub">
        🔥 {member.streak} ngày • 📈 {member.progress}%
      </div>
    </div>
  </div>
);

const PostSnippet = ({ post }) => (
  <div className="post-snippet">
    <div className="post-meta">
      <div className="member-avatar small" style={{ background: post.color }}>
        {post.initials}
      </div>
      <div>
        <div className="post-author">{post.author}</div>
        <div className="post-time">{post.time}</div>
      </div>
    </div>
    <div className="post-summary">{post.summary}</div>
    <div className="post-actions">
      <span>❤️ {post.reactions}</span>
      <span>💬 {post.comments}</span>
    </div>
  </div>
);

const GroupCard = ({ group }) => (
  <GroupCardWithCollapse group={group} />
);

const GroupCardWithCollapse = ({ group }) => {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed(prev => !prev);

  return (
    <div className={`group-card ${collapsed ? 'collapsed' : ''}`}>
      <div className="group-card__header">
        <button
          type="button"
          className="collapse-toggle"
          onClick={toggle}
          title="Thu gọn/Mở rộng"
        >
          {collapsed ? '▶' : '▼'}
        </button>
        <div className="group-head-info">
          <div className="group-title">{group.name}</div>
          <div className="group-stats">
            <span>👥 {group.members} thành viên</span>
            <span>🔥 Chuỗi nhóm: {group.streak} ngày</span>
            <span>📊 Tiến độ TB: {group.progress}%</span>
          </div>
        </div>
        <div className="group-menu">
          <button type="button" className="btn btn-outline-primary btn-sm">📊 Thống kê</button>
          <button type="button" className="btn btn-outline-secondary btn-sm">✏️ Chỉnh sửa</button>
          <button type="button" className="btn btn-primary btn-sm">💬 Thảo luận</button>
        </div>
      </div>

      {collapsed ? (
        <div className="collapsed-summary">
          <QuickStat icon="👥" label="Thành viên" value={group.members} />
          <QuickStat icon="🔥" label="Chuỗi" value={`${group.streak} ngày`} />
          <QuickStat icon="📊" label="Tiến độ" value={`${group.progress}%`} />
        </div>
      ) : (
        <>
          <div className="group-subtitle">{group.description}</div>
          <div className="group-tags">
            {group.tags.map(tag => (
              <Badge key={tag} variant="light" className="me-2 mb-2">{tag}</Badge>
            ))}
          </div>

          <div className="group-metrics">
            <QuickStat icon="👥" label="Thành viên" value={group.members} />
            <QuickStat icon="🔥" label="Chuỗi nhóm" value={`${group.streak} ngày`} />
            <QuickStat icon="📈" label="Tiến độ TB" value={`${group.progress}%`} />
            <div className="goal-progress">
              <div className="goal-head">
                <span>Mục tiêu tuần</span>
                <span className="goal-value">{group.weeklyGoal.current}/{group.weeklyGoal.total} hoàn thành</span>
              </div>
              <ProgressBar now={(group.weeklyGoal.current / group.weeklyGoal.total) * 100} />
            </div>
          </div>

          <div className="member-section">
            <div className="member-section-head">
              <span>Thành viên ({group.members})</span>
              <button type="button" className="btn btn-primary btn-sm">+ Thêm</button>
            </div>
            <div className="member-list">
              {group.featuredMembers.map(member => (
                <MemberChip key={member.name} member={member} />
              ))}
            </div>
            <div className="member-more">Xem thêm thành viên...</div>
          </div>

          <div className="discussion-actions">
            <button type="button" className="btn btn-primary w-100">💬 Thảo luận</button>
          </div>

          <div className="discussion-container">
            <div className="create-post-box">
              <div className="create-post-input">
                <div className="user-avatar">PI</div>
                <textarea className="create-post-textarea" placeholder="Chia sẻ suy nghĩ của bạn với nhóm..." rows="1" />
              </div>
              <div className="post-actions">
                <button className="post-action-btn">
                  <span>📷</span>
                  <span>Ảnh/Video</span>
                </button>
                <button className="post-action-btn">
                  <span>📎</span>
                  <span>File</span>
                </button>
                <button className="post-action-btn">
                  <span style={{ color: 'var(--primary)' }}>✉️ Đăng</span>
                </button>
              </div>
            </div>

            <div className="discussion-feed">
              {group.posts.map(post => (
                <div key={post.id} className="feed-post">
                  <div className="post-header">
                    <div className="user-avatar" style={{ background: post.color }}>{post.initials}</div>
                    <div className="post-author-info">
                      <div className="post-author-name">{post.author}</div>
                      <div className="post-time">{post.time} • 👥 Nhóm</div>
                    </div>
                    <button className="icon-button">⋯</button>
                  </div>
                  <div className="post-content">{post.summary}</div>
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
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const SuggestionCard = ({ suggestion }) => (
  <div className="suggestion-card">
    <div className="suggestion-head">
      <div className="suggestion-title">{suggestion.name}</div>
      <Badge variant="light">{suggestion.members} thành viên</Badge>
    </div>
    <div className="suggestion-focus">{suggestion.focus}</div>
    <div className="suggestion-tags">
      {suggestion.tags.map(tag => (
        <Badge key={tag} variant="primary" className="me-2 mb-2">{tag}</Badge>
      ))}
    </div>
    <div className="suggestion-footer">
      <ProgressBar now={suggestion.progress} label={`${suggestion.progress}% hoạt động`} />
      <button type="button" className="btn btn-outline-primary btn-sm">Tham gia</button>
    </div>
  </div>
);

const StudyGroupsTab = () => {
  const { courseId } = useParams();
  const welcomeModel = useModel('welcome', courseId) || {};
  const userStats = welcomeModel.userStats || {
    streakDays: 12,
    lastDayOfStreak: null,
  };

  const myGroups = useMemo(() => GROUPS_MOCK, []);
  const groupStreaks = useMemo(() => myGroups.map((group, idx) => ({
    id: idx + 1,
    name: group.name,
    streakDays: group.streak,
    members: group.featuredMembers.slice(0, 3).map((m, mIdx) => ({
      id: `${group.id}-${mIdx}`,
      initial: m.initials.slice(0, 2),
      color: m.color,
    })),
    additionalMembers: Math.max(group.members - 3, 0),
    status: 'in_progress',
    message: '💪 Giữ streak nhóm hôm nay nhé!',
  })), [myGroups]);

  return (
    <Container className="study-groups-tab px-0">
      <Row>
        <Col lg={8} md={12}>
          <div className="groups-header">
            <div>
              <h2>Nhóm học tập</h2>
              <p className="header-sub">Học cùng nhau để cùng tiến bộ!</p>
            </div>
            <div className="groups-actions">
              <button type="button" className="btn btn-primary">+ Tạo nhóm mới</button>
            </div>
          </div>

          <section className="panel">
            <div className="panel-head">
              <div>
                <div className="panel-eyebrow">Nhóm của bạn</div>
                <h3>Các nhóm bạn đang tham gia</h3>
              </div>
              <div className="panel-actions">
                <button type="button" className="btn btn-outline-primary btn-sm">Mời thành viên</button>
                <button type="button" className="btn btn-outline-secondary btn-sm">Tùy chọn</button>
              </div>
            </div>
            <div className="group-list">
              {myGroups.map(group => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          </section>
        </Col>

        <Col lg={4} md={12} className="mt-3 mt-lg-0">
          <div className="study-groups-sidebar">
            <StreakCalendar
              streakDays={userStats.streakDays}
              lastDayOfStreak={userStats.lastDayOfStreak}
            />
            <GroupStreaks groups={groupStreaks} />
            <StudyTip />
            <ReferralWidget />
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default StudyGroupsTab;


