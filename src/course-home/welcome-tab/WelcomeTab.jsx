import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Spinner, Alert, Row, Col } from '@openedx/paragon';
import { useModel } from '../../generic/model-store';
import Timeline from '../dates-tab/timeline/Timeline';
import { fetchDatesTab } from '../data';
import StreakCalendar from './StreakCalendar';
import GroupStreaks from './GroupStreaks';
import StudyTip from './StudyTip';
import ReferralWidget from './ReferralWidget';
import './WelcomeTab.scss';

const WelcomeTab = () => {
  const { courseId } = useParams();
  const dispatch = useDispatch();
  const {
    title,
    org,
  } = useModel('courseHomeMeta', courseId) || {};

  // Use data from model store (fetched by TabContainer)
  const welcomeModel = useModel('welcome', courseId) || {};
  // Data structure: welcomeModel contains the API response directly
  const welcomeData = welcomeModel;
  const { courseStatus } = useSelector((state) => state.courseHome);
  const loading = courseStatus === 'loading';
  const error = courseStatus === 'failed' ? 'Không thể tải dữ liệu Chào mừng' : null;
  
  // Fetch dates data để dùng Timeline component
  const datesModel = useModel('dates', courseId) || {};
  const { courseDateBlocks } = datesModel;

  useEffect(() => {
    // Fetch dates data nếu chưa có
    if (courseId && !courseDateBlocks) {
      dispatch(fetchDatesTab(courseId));
    }
  }, [courseId, dispatch, courseDateBlocks]);

  if (loading) {
    return (
      <Container className="welcome-tab py-5 px-2 px-md-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Đang tải dữ liệu...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="welcome-tab py-4 px-2 px-md-4">
        <Alert variant="danger">
          <Alert.Heading>Lỗi</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }

  if (!welcomeData || !welcomeData.success) {
    // Fallback to mock data if API fails
    const userStats = {
      streakDays: 0,
      completionPercent: 0,
      todayLessons: 0,
      classRank: 0,
    };
    const importantDates = [];
    const dailyQuests = [];
    
    return (
      <Container className="welcome-tab py-4 px-2 px-md-4">
        <Alert variant="warning">
          <Alert.Heading>Không có dữ liệu</Alert.Heading>
          <p>Không thể tải dữ liệu Chào mừng cho khóa học này.</p>
        </Alert>
      </Container>
    );
  }

  const userStats = welcomeData.userStats || {
    streakDays: 0,
    completionPercent: 0,
    todayLessons: 0,
    classRank: 0,
  };

  // Use daily quests from API or fallback to mock data
  const dailyQuests = welcomeData.dailyQuests || [
    {
      id: 1,
      title: 'Hoàn thành 1 bài học',
      description: 'Học ít nhất 1 bài để duy trì chuỗi',
      reward: '+20 XP',
      progress: 1,
      total: 1,
      completed: true,
      icon: '📚',
      gradient: 'primary',
    },
    {
      id: 2,
      title: 'Làm 5 bài tập thực hành',
      description: 'Rèn luyện kỹ năng với bài tập',
      reward: '+50 XP • 💰 +30 Điểm',
      progress: 2,
      total: 5,
      completed: false,
      icon: '🎯',
      gradient: 'warning',
    },
  ];

  // Mock data for group streaks
  const groupStreaks = [
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

  // Dates data đã được fetch và lưu trong model store

  const scrollToDailyQuests = () => {
    const element = document.getElementById('daily-quests-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Container className="welcome-tab py-4 px-2 px-md-4">
      <Row>
        {/* Main Content */}
        <Col lg={8} md={12}>
          {/* Welcome Banner */}
          <div className="welcome-banner">
            <h2>Chào mừng trở lại, Pi! 👋</h2>
            <p>Hôm nay là ngày thứ {userStats.streakDays} trong chuỗi ngày học liên tiếp của bạn. Hãy tiếp tục phấn đấu!</p>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{userStats.streakDays}</div>
                <div className="stat-label">🔥 Ngày liên tiếp</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{userStats.completionPercent}%</div>
                <div className="stat-label">📈 Hoàn thành khóa học</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{userStats.todayLessons}</div>
                <div className="stat-label">🎯 Bài học hôm nay</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">#{userStats.classRank}</div>
                <div className="stat-label">🏆 Xếp hạng lớp</div>
              </div>
            </div>
          </div>

          {/* Motivational Call-to-Action Banner */}
          <div className="motivational-banner">
            <div className="banner-bg-circle banner-bg-circle-1" />
            <div className="banner-bg-circle banner-bg-circle-2" />
            <div className="banner-content">
              <div className="banner-text">
                <div className="banner-title">
                  🚀 Hôm nay bạn sẽ làm gì để tiến gần hơn đến mục tiêu?
                </div>
                <div className="banner-subtitle">
                  Mỗi bài học nhỏ hôm nay là một bước tiến lớn trong tương lai!
                </div>
              </div>
              <button 
                className="btn btn-start-learning"
                onClick={scrollToDailyQuests}
              >
                Bắt đầu học ngay! ⚡
              </button>
            </div>
          </div>

          {/* Daily Quests Section */}
          <div id="daily-quests-section" className="daily-quests-section">
            <h3>🎯 Nhiệm vụ hôm nay</h3>
            
            <div className="quests-list">
              {dailyQuests.map((quest) => (
                <div 
                  key={quest.id} 
                  className={`quest-card ${quest.completed ? 'completed' : ''}`}
                >
                  <div className="quest-header">
                    <div className={`quest-icon quest-icon-${quest.gradient}`}>
                      {quest.icon}
                    </div>
                    <div className="quest-info">
                      <div className="quest-title">{quest.title}</div>
                      <div className="quest-description">{quest.description}</div>
                      <div className="quest-reward">
                        <span>⭐</span>
                        <span>{quest.reward}</span>
                      </div>
                    </div>
                  </div>
                  <div className="quest-progress">
                    <div className="quest-progress-text">
                      <span>{quest.progress}/{quest.total} bài</span>
                      <span className={quest.completed ? 'text-success' : 'text-primary'}>
                        {quest.completed ? 'Hoàn thành!' : `${Math.round((quest.progress / quest.total) * 100)}%`}
                      </span>
                    </div>
                    <div className="quest-progress-bar">
                      <div 
                        className="quest-progress-fill"
                        style={{ width: `${(quest.progress / quest.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Important Dates Section - Sử dụng Timeline component giống Dates Tab */}
          <h3 className="section-title">📌 Ngày quan trọng</h3>
          <div className="important-dates-card">
            {courseDateBlocks && courseDateBlocks.length > 0 ? (
              <Timeline />
            ) : (
              <div className="text-center py-4 text-muted">
                <Spinner animation="border" size="sm" className="mr-2" />
                <span>Đang tải ngày quan trọng...</span>
              </div>
            )}
          </div>

          {/* Invite Friends Section */}
          <div className="invite-friends-section">
            <div className="invite-bg-emoji invite-bg-emoji-1">😊</div>
            <div className="invite-bg-emoji invite-bg-emoji-2">🎉</div>
            <div className="invite-content">
              <div className="invite-header">
                <div className="invite-icon">
                  👥
                </div>
                <div className="invite-text">
                  <h3>🎯 Cùng học - Cùng vui - Cùng tiến bộ!</h3>
                  <p>Học một mình buồn, học cùng bạn vui gấp bội!</p>
                </div>
              </div>
              
              <div className="invite-benefits">
                <div className="invite-benefit-item">
                  <div className="benefit-icon">💬</div>
                  <div className="benefit-label">Động viên nhau</div>
                </div>
                <div className="invite-benefit-item">
                  <div className="benefit-icon">🎊</div>
                  <div className="benefit-label">Vui vẻ hơn</div>
                </div>
                <div className="invite-benefit-item">
                  <div className="benefit-icon">🤝</div>
                  <div className="benefit-label">Cùng tiến bộ</div>
                </div>
              </div>
              
              <div className="invite-info-box">
                <p>
                  <strong>💡 Nghiên cứu khoa học:</strong> Học nhóm giúp bạn hiểu bài sâu hơn và nhớ lâu hơn đến 50%! 🧠✨
                </p>
              </div>
              
              <div className="invite-actions">
                <button className="btn btn-invite-primary">
                  👥 Mời bạn cùng học
                </button>
                <button className="btn btn-invite-secondary">
                  📱 Chia sẻ
                </button>
              </div>
            </div>
          </div>
        </Col>

        {/* Sidebar */}
        <Col lg={4} md={12}>
          <StreakCalendar 
            streakDays={userStats.streakDays} 
            lastDayOfStreak={userStats.lastDayOfStreak}
          />
          
          <GroupStreaks groups={groupStreaks} />
          
          <StudyTip />
          
          <ReferralWidget />
        </Col>
      </Row>
    </Container>
  );
};

export default WelcomeTab;

