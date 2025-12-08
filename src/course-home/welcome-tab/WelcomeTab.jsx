import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Spinner, Alert } from '@openedx/paragon';
import { useModel } from '../../generic/model-store';
import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { camelCaseObject } from '@edx/frontend-platform';
import './WelcomeTab.scss';

const WelcomeTab = () => {
  const { courseId } = useParams();
  const {
    title,
    org,
  } = useModel('courseHomeMeta', courseId) || {};

  const [welcomeData, setWelcomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWelcomeData = async () => {
      setLoading(true);
      setError(null);
      try {
        const encodedCourseId = encodeURIComponent(courseId);
        const url = `${getConfig().LMS_BASE_URL}/api/course_home/welcome/${encodedCourseId}`;
        
        const response = await getAuthenticatedHttpClient().get(url);
        const { data } = response;
        
        // Check if response is HTML instead of JSON (API not deployed)
        if (typeof data === 'string' && (data.includes('<!DOCTYPE') || data.includes('<html'))) {
          setError("API Chào mừng chưa được deploy trên server. Vui lòng liên hệ admin để cập nhật backend.");
          return;
        }
        
        // Check if data is valid object
        if (!data || typeof data !== 'object') {
          setError("Dữ liệu trả về không hợp lệ.");
          return;
        }
        
        const camelCased = camelCaseObject(data);
        setWelcomeData(camelCased);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
          setError("API Chào mừng không tồn tại trên server (404). Vui lòng deploy backend Welcome API.");
        } else if (status === 401 || status === 403) {
          setError("Bạn không có quyền truy cập dữ liệu Chào mừng.");
        } else {
          setError(`Không thể tải dữ liệu Chào mừng: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchWelcomeData();
    }
  }, [courseId]);

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

  // Use daily quests from API or fallback to empty array
  const dailyQuests = welcomeData.dailyQuests || [
    // Fallback mock data if API doesn't return quests yet
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

  // Format important dates from API
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${dayName}, ${day}/${month}/${year}`;
  };

  const importantDates = (welcomeData.importantDates || []).map(dateItem => ({
    ...dateItem,
    formattedDate: formatDate(dateItem.date),
  }));

  const scrollToDailyQuests = () => {
    const element = document.getElementById('daily-quests-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Container className="welcome-tab py-4 px-2 px-md-4">
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

      {/* Important Dates Section */}
      <h3 className="section-title">📌 Ngày quan trọng</h3>
      <div className="important-dates-card">
        <div className="timeline-container">
          <div className="timeline-line" />
          
          <div className="timeline-items">
                            {importantDates.map((dateItem, index) => (
              <div key={index} className="timeline-item">
                <div className={`timeline-dot timeline-dot-${dateItem.status}`} />
                <div className="timeline-content">
                  <div className="timeline-date-row">
                    <div className="timeline-date">{dateItem.formattedDate || dateItem.date}</div>
                    {dateItem.daysLeft && (
                      <div className="timeline-badge timeline-badge-warning">
                        Còn {dateItem.daysLeft} ngày
                      </div>
                    )}
                    {dateItem.status === 'today' && (
                      <div className="timeline-badge timeline-badge-today">
                        Hôm nay
                      </div>
                    )}
                  </div>
                  <div className={`timeline-title ${dateItem.status === 'future' ? 'timeline-title-future' : ''}`}>
                    {dateItem.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
    </Container>
  );
};

export default WelcomeTab;

