import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Container, Spinner, Alert, Row, Col } from "@openedx/paragon";
import { useModel } from "../../generic/model-store";
import { fetchProgressTab, fetchWelcomeTab } from "../../course-home/data";
import './BadgeTab.scss';

// Mock data for achievements tab
const mockStats = {
  level: 15,
  xp: 4250,
  xpToNextLevel: 5000,
  coins: 1850,
  badges: 12,
  streakDays: 12,
  completedLessons: 156,
  averageScore: 9.2,
  classRank: 5,
};

const mockFeaturedBadges = [
  { icon: '🎯', name: 'Người mới' },
  { icon: '🔥', name: 'Chuỗi 7 ngày' },
  { icon: '📚', name: 'Chương 1' },
  { icon: '⭐', name: 'Điểm cao' },
];

const mockCertificates = {
  courseCompletion: {
    title: 'Chứng nhận Hoàn thành Toán 7',
    status: 'locked', // 'locked', 'in_progress', 'earned'
    progress: 10, // percentage
    completedChapters: 1,
    totalChapters: 10,
    requirements: [
      { text: 'Hoàn thành 10/10 chương', completed: false, current: '1/10 ✓' },
      { text: 'Điểm trung bình ≥ 7.0/10', completed: true, current: '9.2/10 ✓' },
      { text: 'Hoàn thành tất cả bài kiểm tra', completed: false, current: '1/10' },
      { text: 'Tỷ lệ tham gia học tập ≥ 80%', completed: false, current: '67%' },
    ],
  },
  chapters: [
    {
      id: 1,
      title: 'Chứng nhận Hoàn thành Chương 1',
      status: 'earned',
      earnedDate: '20/11/2025',
      duration: '2 tuần',
      description: 'Hoàn thành xuất sắc Chương 1 - Số hữu tỉ với điểm trung bình 9.2/10',
    },
    {
      id: 2,
      title: 'Chứng nhận Hoàn thành Chương 2',
      status: 'in_progress',
      progress: 40,
      completedLessons: 2,
      totalLessons: 5,
      description: 'Hoàn thành Chương 2 - Số thực để nhận chứng nhận',
    },
    {
      id: 3,
      title: 'Chứng nhận Hoàn thành Chương 3',
      status: 'locked',
      progress: 0,
      completedLessons: 0,
      totalLessons: 6,
      description: 'Hoàn thành Chương 3 - Hàm số và đồ thị',
    },
  ],
};

const mockRewards = [
  {
    id: 1,
    type: 'badges',
    icon: '⭐',
    name: 'Huy hiệu Học sinh 5 tốt',
    redeemedDate: '15/11/2025',
    equipped: false,
  },
  {
    id: 2,
    type: 'avatars',
    icon: '🎓',
    name: 'Avatar Thần đồng Toán học',
    redeemedDate: '10/11/2025',
    equipped: true,
  },
  {
    id: 3,
    type: 'real',
    icon: '🎟️',
    name: 'Vé xem phim CGV',
    redeemedDate: '01/12/2025',
    status: 'processing',
    statusText: 'Đang xử lý - Sẽ gửi đến email trong 24-48h',
  },
  {
    id: 4,
    type: 'badges',
    icon: '🔥',
    name: 'Huy hiệu Chiến binh Toán học',
    redeemedDate: '05/11/2025',
    equipped: false,
  },
];

function BadgeTab() {
  const { courseId } = useParams();
  const dispatch = useDispatch();
  const progressModel = useModel('progress', courseId);
  const welcomeModel = useModel('welcome', courseId);
  const { courseStatus } = useSelector((state) => state.courseHome);
  
  const [rewardFilter, setRewardFilter] = useState('all');
  const [certificates, setCertificates] = useState(mockCertificates);
  const [rewards, setRewards] = useState(mockRewards);
  
  const loading = courseStatus === 'loading';
  const progressDataLoaded = progressModel && progressModel.completionSummary;
  
  // Get real user stats from welcome API if available
  const welcomeData = welcomeModel || {};
  const userStats = welcomeData.userStats || {};
  
  // Merge real data with mock data
  const stats = {
    level: mockStats.level,
    xp: mockStats.xp,
    xpToNextLevel: mockStats.xpToNextLevel,
    coins: mockStats.coins,
    badges: mockStats.badges,
    streakDays: userStats.streakDays || mockStats.streakDays,
    completedLessons: mockStats.completedLessons, // Could be calculated from progress
    averageScore: mockStats.averageScore, // Could come from progress
    classRank: userStats.classRank || mockStats.classRank,
  };
  
  // Update completion percentage in certificates if we have progress data
  useEffect(() => {
    if (progressModel && progressModel.completionSummary) {
      const completionPercent = progressModel.completionSummary.percent || 0;
      setCertificates(prev => ({
        ...prev,
        courseCompletion: {
          ...prev.courseCompletion,
          progress: Math.round(completionPercent),
        },
      }));
    }
  }, [progressModel]);

  // Fetch progress and welcome data if available
  useEffect(() => {
    if (courseId) {
      if (!progressDataLoaded) {
        dispatch(fetchProgressTab(courseId));
      }
      // Fetch welcome data if not already loaded (for user stats)
      if (!welcomeModel || !welcomeModel.userStats) {
        dispatch(fetchWelcomeTab(courseId));
      }
    }
  }, [courseId, dispatch, progressDataLoaded, welcomeModel]);

  // Calculate progress percentage for next level
  const levelProgress = ((stats.xp / stats.xpToNextLevel) * 100).toFixed(0);
  const xpRemaining = stats.xpToNextLevel - stats.xp;

  // Filter rewards
  const filteredRewards = rewardFilter === 'all' 
    ? rewards 
    : rewards.filter(r => r.type === rewardFilter);

  // Get reward stats
  const rewardStats = {
    total: rewards.length,
    badges: rewards.filter(r => r.type === 'badges').length,
    avatars: rewards.filter(r => r.type === 'avatars').length,
    real: rewards.filter(r => r.type === 'real').length,
  };

  if (loading) {
    return (
      <Container className="badge-tab py-5 px-2 px-md-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Đang tải dữ liệu Thành tích...</p>
      </Container>
    );
  }

  return (
    <Container className="badge-tab py-4 px-2 px-md-4">
      {/* Stats Banner */}
      <div className="stats-banner">
        <div className="stats-banner-bg-circle stats-banner-bg-circle-1" />
        <div className="stats-banner-bg-circle stats-banner-bg-circle-2" />
        
        <div className="stats-banner-content">
          <div className="stats-banner-header">
            <h3 className="stats-banner-title">✨ Thành tích của tôi</h3>
            <button className="btn btn-share-stats" onClick={() => console.log('Share stats')}>
              📤 Chia sẻ
            </button>
          </div>
          
          {/* Main Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-value">{stats.level}</div>
              <div className="stat-label">Level</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">⚡</div>
              <div className="stat-value">{stats.xp.toLocaleString()}</div>
              <div className="stat-label">XP</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-value">{stats.coins.toLocaleString()}</div>
              <div className="stat-label">Điểm</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-value">{stats.badges}</div>
              <div className="stat-label">Badges</div>
            </div>
          </div>
          
          {/* Additional Stats */}
          <div className="additional-stats">
            <div className="additional-stat-item">
              <div className="additional-stat-icon">🔥</div>
              <div className="additional-stat-info">
                <div className="additional-stat-label">Chuỗi học tập</div>
                <div className="additional-stat-value">{stats.streakDays} ngày</div>
              </div>
            </div>
            
            <div className="additional-stat-item">
              <div className="additional-stat-icon">📚</div>
              <div className="additional-stat-info">
                <div className="additional-stat-label">Bài học hoàn thành</div>
                <div className="additional-stat-value">{stats.completedLessons} bài</div>
              </div>
            </div>
            
            <div className="additional-stat-item">
              <div className="additional-stat-icon">⭐</div>
              <div className="additional-stat-info">
                <div className="additional-stat-label">Điểm trung bình</div>
                <div className="additional-stat-value">{stats.averageScore}/10</div>
              </div>
            </div>
            
            <div className="additional-stat-item">
              <div className="additional-stat-icon">🎖️</div>
              <div className="additional-stat-info">
                <div className="additional-stat-label">Hạng</div>
                <div className="additional-stat-value">#{stats.classRank} trong lớp</div>
              </div>
            </div>
          </div>
          
          {/* Progress to Next Level */}
          <div className="level-progress">
            <div className="level-progress-header">
              <div className="level-progress-title">Tiến độ lên Level {stats.level + 1}</div>
              <div className="level-progress-xp">
                {stats.xp.toLocaleString()} / {stats.xpToNextLevel.toLocaleString()} XP
              </div>
            </div>
            <div className="level-progress-bar">
              <div 
                className="level-progress-fill"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <div className="level-progress-text">
              Còn {xpRemaining.toLocaleString()} XP nữa để lên cấp! 🚀
            </div>
          </div>
          
          {/* Featured Badges */}
          <div className="featured-badges">
            <div className="featured-badges-title">Huy hiệu nổi bật</div>
            <div className="featured-badges-list">
              {mockFeaturedBadges.map((badge, index) => (
                <div key={index} className="featured-badge-item">
                  <span className="featured-badge-icon">{badge.icon}</span>
                  <span className="featured-badge-name">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Share Buttons */}
          <div className="share-section">
            <div className="share-message">Chia sẻ thành tích của bạn! 🎉</div>
            <div className="share-buttons">
              <button className="btn btn-share btn-share-facebook" onClick={() => console.log('Share to Facebook')}>
                <span>📘</span>
                <span>Facebook</span>
              </button>
              <button className="btn btn-share btn-share-instagram" onClick={() => console.log('Share to Instagram')}>
                <span>📷</span>
                <span>Instagram</span>
              </button>
              <button className="btn btn-share btn-share-zalo" onClick={() => console.log('Share to Zalo')}>
                <span>💬</span>
                <span>Zalo</span>
              </button>
              <button className="btn btn-share btn-share-download" onClick={() => console.log('Download image')}>
                <span>📥</span>
                <span>Tải ảnh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Certificates Section */}
      <div className="certificates-section">
        <h3 className="certificates-title">🎓 Chứng nhận</h3>
        <p className="certificates-description">
          Hoàn thành các mốc học tập để nhận chứng nhận và chia sẻ thành tích của bạn!
        </p>

        {/* Course Completion Certificate */}
        <div className="certificate-subsection">
          <h4 className="certificate-subsection-title">
            <span>🏆</span> Chứng nhận khóa học
          </h4>
          
          <div className={`certificate-card ${certificates.courseCompletion.status}`}>
            <div className="certificate-header">
              <div className="certificate-header-content">
                <div className={`certificate-badge ${certificates.courseCompletion.status === 'locked' ? 'locked' : ''}`}>
                  🎯
                </div>
                <div className="certificate-info">
                  <h3 className={certificates.courseCompletion.status === 'locked' ? 'locked' : ''}>
                    {certificates.courseCompletion.title}
                  </h3>
                  <div className="certificate-meta">
                    <span>📊 Yêu cầu: Hoàn thành tất cả {certificates.courseCompletion.totalChapters} chương</span>
                    <span>⭐ Điểm TB: ≥ 7.0/10</span>
                  </div>
                  <p className={certificates.courseCompletion.status === 'locked' ? 'locked' : ''}>
                    Chứng nhận tổng kết khóa học Toán 7 - Hoàn thành xuất sắc toàn bộ chương trình
                  </p>
                </div>
              </div>
              <div className={`certificate-status ${certificates.courseCompletion.status}`}>
                {certificates.courseCompletion.status === 'locked' && '🔒 Chưa mở'}
                {certificates.courseCompletion.status === 'in_progress' && '⏳ Đang học'}
                {certificates.courseCompletion.status === 'earned' && '✓ Đã đạt'}
              </div>
            </div>
            
            <div className="certificate-progress">
              <div className="certificate-progress-text">
                <span>
                  {certificates.courseCompletion.completedChapters}/{certificates.courseCompletion.totalChapters} chương hoàn thành
                </span>
                <span className={certificates.courseCompletion.status === 'locked' ? 'locked' : ''}>
                  {certificates.courseCompletion.progress}%
                </span>
              </div>
              <div className="certificate-progress-bar">
                <div 
                  className="certificate-progress-fill"
                  style={{ width: `${certificates.courseCompletion.progress}%` }}
                />
              </div>
            </div>
            
            <div className="certificate-requirements">
              <strong>📋 Điều kiện đạt chứng nhận:</strong>
              <ul>
                {certificates.courseCompletion.requirements.map((req, index) => (
                  <li key={index}>
                    {req.text} ({req.current})
                  </li>
                ))}
              </ul>
            </div>
            
            {certificates.courseCompletion.status === 'earned' && (
              <div className="certificate-actions">
                <button className="btn btn-cert btn-cert-primary">📥 Tải xuống</button>
                <button className="btn btn-cert btn-cert-secondary">👁️ Xem</button>
                <button className="btn btn-cert btn-cert-secondary">📤 Chia sẻ</button>
              </div>
            )}
          </div>
        </div>

        {/* Chapter Certificates */}
        <div className="certificate-subsection">
          <h4 className="certificate-subsection-title">
            <span>📚</span> Chứng nhận theo chương
          </h4>
          
          {certificates.chapters.map((chapter) => (
            <div key={chapter.id} className={`certificate-card ${chapter.status}`}>
              <div className="certificate-header">
                <div className="certificate-header-content">
                  <div className={`certificate-badge ${chapter.status === 'locked' ? 'locked' : ''}`}>
                    {chapter.status === 'earned' ? '🏆' : chapter.status === 'in_progress' ? '📚' : '📖'}
                  </div>
                  <div className="certificate-info">
                    <h3 className={chapter.status === 'locked' ? 'locked' : ''}>
                      {chapter.title}
                    </h3>
                    {chapter.status === 'earned' && (
                      <div className="certificate-meta">
                        <span>📅 Đạt được: {chapter.earnedDate}</span>
                        <span>⏱️ Thời gian: {chapter.duration}</span>
                      </div>
                    )}
                    {chapter.status === 'in_progress' && (
                      <div className="certificate-meta">
                        <span>📊 Tiến độ: {chapter.progress}%</span>
                      </div>
                    )}
                    {chapter.status === 'locked' && (
                      <div className="certificate-meta">
                        <span>📊 Yêu cầu: Hoàn thành chương {chapter.id - 1}</span>
                      </div>
                    )}
                    <p className={chapter.status === 'locked' ? 'locked' : ''}>
                      {chapter.description}
                    </p>
                  </div>
                </div>
                <div className={`certificate-status ${chapter.status}`}>
                  {chapter.status === 'locked' && '🔒 Chưa mở'}
                  {chapter.status === 'in_progress' && '⏳ Đang học'}
                  {chapter.status === 'earned' && '✓ Đã đạt'}
                </div>
              </div>
              
              {(chapter.status === 'in_progress' || chapter.status === 'locked') && (
                <div className="certificate-progress">
                  <div className="certificate-progress-text">
                    <span>
                      {chapter.completedLessons}/{chapter.totalLessons} bài học hoàn thành
                    </span>
                    <span className={chapter.status === 'locked' ? 'locked' : ''}>
                      {chapter.progress}%
                    </span>
                  </div>
                  <div className="certificate-progress-bar">
                    <div 
                      className="certificate-progress-fill"
                      style={{ width: `${chapter.progress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {chapter.status === 'earned' && (
                <div className="certificate-actions">
                  <button className="btn btn-cert btn-cert-primary">📥 Tải xuống</button>
                  <button className="btn btn-cert btn-cert-secondary">👁️ Xem</button>
                  <button className="btn btn-cert btn-cert-secondary">📤 Chia sẻ</button>
                </div>
              )}
              
              {chapter.status === 'in_progress' && (
                <div className="certificate-actions">
                  <button className="btn btn-cert btn-cert-primary">▶️ Tiếp tục học</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Redeemed Rewards Section */}
      <div className="rewards-section">
        <div className="rewards-header">
          <h3 className="rewards-title">🎁 Phần thưởng đã đổi</h3>
          <button className="btn btn-shop" onClick={() => console.log('Open shop')}>
            🛒 Đổi thêm
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="reward-filters">
          <button 
            className={`filter-btn ${rewardFilter === 'all' ? 'active' : ''}`}
            onClick={() => setRewardFilter('all')}
          >
            Tất cả
          </button>
          <button 
            className={`filter-btn ${rewardFilter === 'badges' ? 'active' : ''}`}
            onClick={() => setRewardFilter('badges')}
          >
            🎖️ Huy hiệu
          </button>
          <button 
            className={`filter-btn ${rewardFilter === 'avatars' ? 'active' : ''}`}
            onClick={() => setRewardFilter('avatars')}
          >
            👤 Avatar
          </button>
          <button 
            className={`filter-btn ${rewardFilter === 'real' ? 'active' : ''}`}
            onClick={() => setRewardFilter('real')}
          >
            🎁 Phần thưởng
          </button>
        </div>

        {/* Rewards Grid */}
        {filteredRewards.length > 0 ? (
          <div className="rewards-grid">
            {filteredRewards.map((reward) => (
              <div key={reward.id} className="reward-item">
                <div className="reward-item-header">
                  <div className="reward-icon">{reward.icon}</div>
                  <div className="reward-info">
                    <h4 className="reward-name">{reward.name}</h4>
                    <div className="reward-date">Đổi ngày: {reward.redeemedDate}</div>
                    {reward.status && (
                      <div className="reward-status">
                        <strong>📧 {reward.statusText}</strong>
                      </div>
                    )}
                  </div>
                </div>
                <div className="reward-actions">
                  {reward.type === 'real' ? null : (
                    <>
                      <button 
                        className={`btn btn-reward ${reward.equipped ? 'btn-reward-equipped' : 'btn-reward-equip'}`}
                        onClick={() => console.log('Equip reward', reward.id)}
                      >
                        {reward.equipped ? '✅ Đang dùng' : '✨ Trang bị'}
                      </button>
                      <button 
                        className="btn btn-reward-share"
                        onClick={() => console.log('Share reward', reward.id)}
                      >
                        📤
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rewards-empty">
            <div className="rewards-empty-icon">🎁</div>
            <h4>Chưa có phần thưởng nào</h4>
            <p>Hãy tích lũy điểm và đổi phần thưởng đầu tiên của bạn!</p>
            <button className="btn btn-primary" onClick={() => console.log('Open shop')}>
              🛒 Khám phá cửa hàng
            </button>
          </div>
        )}

        {/* Reward Stats */}
        <div className="reward-stats">
          <h4>📊 Thống kê phần thưởng</h4>
          <div className="reward-stats-grid">
            <div className="reward-stat-item">
              <div className="reward-stat-value">{rewardStats.total}</div>
              <div className="reward-stat-label">Tổng phần thưởng</div>
            </div>
            <div className="reward-stat-item">
              <div className="reward-stat-value">{rewardStats.badges}</div>
              <div className="reward-stat-label">Huy hiệu</div>
            </div>
            <div className="reward-stat-item">
              <div className="reward-stat-value">{rewardStats.avatars}</div>
              <div className="reward-stat-label">Avatar</div>
            </div>
            <div className="reward-stat-item">
              <div className="reward-stat-value">{rewardStats.real}</div>
              <div className="reward-stat-label">Phần thưởng</div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Motivation Banner */}
      <div className="achievement-banner">
        <div className="achievement-banner-icon">🎯</div>
        <div className="achievement-banner-content">
          <div className="achievement-banner-title">
            Tiếp tục chinh phục mục tiêu - Mỗi thành tích là một bước tiến!
          </div>
          <div className="achievement-banner-subtitle">
            <strong>"Thành công là tổng của những nỗ lực nhỏ lặp đi lặp lại"</strong> 🌟
          </div>
        </div>
        <div className="achievement-banner-actions">
          <button className="btn btn-secondary" onClick={() => console.log('Share stats')}>
            📊 Chia sẻ thành tích
          </button>
        </div>
      </div>
    </Container>
  );
}

export default BadgeTab;
