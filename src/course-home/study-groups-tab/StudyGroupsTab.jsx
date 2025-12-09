import React, { useMemo } from 'react';
import {
  Badge,
  Container,
  ProgressBar,
  Row,
  Col,
} from '@openedx/paragon';

import './StudyGroupsTab.scss';

const HERO_TIPS = [
  'Kết nối bạn học để cùng giải bài khó và ôn thi.',
  'Chia sẻ tiến độ, giữ streak nhóm và động viên nhau mỗi ngày.',
  'Đặt mục tiêu tuần và tổng kết nhanh ngay trong nhóm.',
];

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

const SUGGESTED_GROUPS = [
  {
    id: 's1',
    name: 'Nhóm luyện đề cuối kỳ',
    members: 18,
    progress: 65,
    focus: 'Ôn tập tổng hợp, chữa đề mỗi tuần',
    tags: ['Giải đề', 'Ghi chú chung'],
  },
  {
    id: 's2',
    name: 'Nhóm giữ streak 30 ngày',
    members: 9,
    progress: 54,
    focus: 'Check-in hằng ngày, nhắc học và thưởng badge',
    tags: ['Motivation', 'Daily check-in'],
  },
  {
    id: 's3',
    name: 'Nhóm hỗ trợ bài khó',
    members: 22,
    progress: 70,
    focus: 'Đặt câu hỏi và nhận giải đáp nhanh từ bạn bè',
    tags: ['Hỏi đáp', 'Tài liệu'],
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
  <div className="group-card">
    <div className="group-card__header">
      <div>
        <div className="group-title">{group.name}</div>
        <div className="group-subtitle">{group.description}</div>
        <div className="group-tags">
          {group.tags.map(tag => (
            <Badge key={tag} variant="light" className="me-2 mb-2">{tag}</Badge>
          ))}
        </div>
      </div>
      <div className="group-actions">
        <button type="button" className="btn btn-outline-primary btn-sm">📊 Xem thống kê</button>
        <button type="button" className="btn btn-primary btn-sm">💬 Thảo luận</button>
      </div>
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

    <Row className="mt-3">
      <Col md={5}>
        <div className="section-title">Thành viên nổi bật</div>
        <div className="member-list">
          {group.featuredMembers.map(member => (
            <MemberChip key={member.name} member={member} />
          ))}
        </div>
      </Col>
      <Col md={7}>
        <div className="section-title">Hoạt động gần đây</div>
        <div className="post-list">
          {group.posts.map(post => (
            <PostSnippet key={post.id} post={post} />
          ))}
        </div>
      </Col>
    </Row>
  </div>
);

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
  const myGroups = useMemo(() => GROUPS_MOCK, []);
  const suggestedGroups = useMemo(() => SUGGESTED_GROUPS, []);

  return (
    <Container className="study-groups-tab px-0">
      <div className="study-groups-hero">
        <div>
          <p className="eyebrow">Nhóm học tập</p>
          <h1>Kết nối, giữ động lực và học nhanh hơn cùng bạn bè 👥</h1>
          <p className="hero-sub">
            Tạo nhóm riêng, đặt mục tiêu chung, chia sẻ tài nguyên và tổng kết tiến độ mỗi tuần.
          </p>
          <div className="hero-tips">
            {HERO_TIPS.map(tip => (
              <div key={tip} className="hero-tip">✅ {tip}</div>
            ))}
          </div>
        </div>
        <div className="hero-actions">
          <button type="button" className="btn btn-outline-primary">Tìm nhóm</button>
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
            <button type="button" className="btn btn-outline-primary btn-sm">Mời bạn bè</button>
            <button type="button" className="btn btn-outline-secondary btn-sm">Quản lý nhóm</button>
          </div>
        </div>
        <div className="group-list">
          {myGroups.map(group => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-eyebrow">Gợi ý cho bạn</div>
            <h3>Khám phá nhóm học tập nổi bật</h3>
          </div>
        </div>
        <div className="suggestions-grid">
          {suggestedGroups.map(suggestion => (
            <SuggestionCard key={suggestion.id} suggestion={suggestion} />
          ))}
        </div>
      </section>
    </Container>
  );
};

export default StudyGroupsTab;


