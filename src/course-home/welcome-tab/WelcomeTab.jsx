import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Spinner, Alert, Row, Col } from '@openedx/paragon';
import { useModel } from '../../generic/model-store';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import Timeline from '../dates-tab/timeline/Timeline';
import { fetchDatesTab, fetchProgressTab, fetchStudyGroupsTab } from '../data';
import { getGroupStreaks, getStudyGroupComments, getStudyGroupsTabData } from '../data/api';
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
  const hasWelcomeData = Boolean(welcomeData && welcomeData.success);
  // Nếu chưa có dữ liệu welcome hoặc course đang loading, luôn hiển thị trạng thái đang tải
  const loading = courseStatus === 'loading' || !hasWelcomeData;
  const error = courseStatus === 'failed' ? 'Không thể tải dữ liệu Chào mừng' : null;
 
  // Use progress model early so hooks order remains stable
  const progressModel = useModel('progress', courseId) || {};
  const completionSummary = progressModel.completionSummary || {};
  const completeCount = completionSummary.completeCount || 0;
  const incompleteCount = completionSummary.incompleteCount || 0;
  const lockedCount = completionSummary.lockedCount || 0;
  const totalUnits = completeCount + incompleteCount + lockedCount || 0;

  // Determine enrollment (try several fields returned by API; default to true if not provided)
  const isEnrolled = (() => {
    if (typeof welcomeData?.courseAccess?.isEnrolled === 'boolean') return welcomeData.courseAccess.isEnrolled;
    if (typeof welcomeData?.is_enrolled === 'boolean') return welcomeData.is_enrolled;
    if (typeof welcomeData?.userStats?.isEnrolled === 'boolean') return welcomeData.userStats.isEnrolled;
    return true;
  })();

  // Determine whether current user has posted in any study group (scan model then fallback to API)
  const studyGroupsModel = useModel('study-groups', courseId) || {};
  const studyGroups = studyGroupsModel.results || [];
  const currentUser = getAuthenticatedUser();
  const currentUsername = currentUser?.username || null;
  const [hasPostedDiscussion, setHasPostedDiscussion] = useState(Boolean(welcomeData.studyGroupPostsCount || welcomeData.study_group_posts_count || false));

  useEffect(() => {
    let cancelled = false;
    if (!currentUsername || !courseId) return undefined;

    const checkPosted = async () => {
      let groupsToCheck = studyGroups;
      // if model has no groups, try fetching via API
      if ((!groupsToCheck || groupsToCheck.length === 0) && courseId) {
        try {
          const data = await getStudyGroupsTabData(courseId);
          groupsToCheck = data.results || data || [];
        } catch (err) {
          groupsToCheck = [];
        }
      }
      // First scan any embedded comments on groups returned in the model
      for (const g of groupsToCheck) {
        const comments = g.comments || g.comments_results || g.commentsList || g.comments_list || [];
        if (Array.isArray(comments) && comments.length > 0) {
          for (const c of comments) {
            const authorUser = c.user || c.author || c.created_by || c.createdBy || {};
            const authorUsername = authorUser?.username || c.username || c.userName || null;
            if (authorUsername && authorUsername.toLowerCase() === currentUsername.toLowerCase()) {
              if (!cancelled) setHasPostedDiscussion(true);
              return;
            }
          }
        }
      }

      // Fallback: request comments per group from API until we find one by current user
      for (const g of groupsToCheck) {
        try {
          const data = await getStudyGroupComments(g.id);
          const results = data.results || [];
          for (const c of results) {
            const authorUser = c.user || c.author || c.created_by || c.createdBy || {};
            const authorUsername = authorUser?.username || c.username || c.userName || null;
            if (authorUsername && authorUsername.toLowerCase() === currentUsername.toLowerCase()) {
              if (!cancelled) setHasPostedDiscussion(true);
              return;
            }
          }
        } catch (err) {
          // ignore and continue
        }
      }

      if (!cancelled) setHasPostedDiscussion(false);
    };

    checkPosted();
    return () => {
      cancelled = true;
    };
  }, [studyGroups, currentUsername, courseId, welcomeData]);
  
  // Fetch dates data để dùng Timeline component
  const datesModel = useModel('dates', courseId) || {};
  const { courseDateBlocks } = datesModel;

  useEffect(() => {
    // Fetch dates data nếu chưa có
    if (courseId && !courseDateBlocks) {
      dispatch(fetchDatesTab(courseId));
    }
  }, [courseId, dispatch, courseDateBlocks]);

  // Ensure progress model is loaded (BadgeTab fetches it; WelcomeTab needs it too)
  useEffect(() => {
    const shouldFetchProgress = courseId && !(progressModel && progressModel.completionSummary);
    if (shouldFetchProgress) {
      dispatch(fetchProgressTab(courseId));
    }
  }, [courseId, dispatch, progressModel]);

  // Ensure study-groups model is loaded so we can inspect comments if backend provides them
  useEffect(() => {
    const shouldFetchStudyGroups = courseId && !(studyGroupsModel && studyGroupsModel.results !== undefined);
    if (shouldFetchStudyGroups) {
      dispatch(fetchStudyGroupsTab(courseId));
    }
  }, [courseId, dispatch, studyGroupsModel]);

  // Fetch group streaks
  const [groupStreaks, setGroupStreaks] = useState([]);
  const [loadingStreaks, setLoadingStreaks] = useState(true);

  useEffect(() => {
    const fetchGroupStreaks = async () => {
      if (!courseId) {
        setLoadingStreaks(false);
        return;
      }
      
      setLoadingStreaks(true);
      try {
        const data = await getGroupStreaks(courseId);
        if (data && data.success && data.groups) {
          setGroupStreaks(data.groups);
        } else {
          setGroupStreaks([]);
        }
      } catch (error) {
        // Giữ xử lý lỗi nhưng không log ra console để tránh spam
        setGroupStreaks([]);
      } finally {
        setLoadingStreaks(false);
      }
    };

    fetchGroupStreaks();
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

  const userStats = welcomeData.userStats || {
    streakDays: 0,
    completionPercent: 0,
    todayLessons: 0,
    classRank: 0,
  };

  // Use daily quests from API when available, otherwise build fallback using real progress data
  const dailyQuests = (welcomeData.dailyQuests && welcomeData.dailyQuests.length > 0)
    ? welcomeData.dailyQuests
    : [
        {
          id: 1,
          title: 'Hoàn thành bài học',
          description: 'Hoàn thành Unit trong khoá học',
          reward: '+ XP',
          progress: Math.min(completeCount, totalUnits > 0 ? completeCount : 0),
          total: totalUnits > 0 ? totalUnits : 0,
          completed: totalUnits > 0 ? completeCount >= 1 : false,
          icon: '📚',
          gradient: 'primary',
        },
        {
          id: 2,
          title: 'Luyện Game học tập tương tác',
          description: 'Rèn luyện kỹ năng với bài tập',
          reward: '+ XP • 💰 + Xu',
          progress: 0,
          total: 5,
          completed: false,
          icon: '🎯',
          gradient: 'warning',
        },
        {
          id: 3,
          title: 'Tham gia thảo luận',
          description: 'Bạn phải là học viên khoá học và đăng ít nhất 1 bài trong Nhóm học tập',
          reward: '+ XP • 💰 + Xu',
          progress: hasPostedDiscussion ? 1 : 0,
          total: 1,
          completed: Boolean(isEnrolled && hasPostedDiscussion),
          icon: '💬',
          gradient: 'primary',
        },
      ];

  // Dates data đã được fetch và lưu trong model store

  // Feature flags / feature availability from welcomeData (if provided by backend)
  const referralEnabled = Boolean(welcomeData && welcomeData.referralEnabled);

  const scrollToDailyQuests = () => {
    const element = document.getElementById('daily-quests-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Helpers for sharing / copying referral
  const referralCode = welcomeData?.referralCode || welcomeData?.referral_code || 'PI2025';
  const referralLink = `${window.location.origin}${window.location.pathname}?ref=${referralCode}`;
  const handleInviteShare = async () => {
    const shareText = `Mời bạn học ${title || ''} cùng mình trên PiStudy! Mã giới thiệu: ${referralCode}\n${referralLink}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mời học ${title || ''}`,
          text: shareText,
          url: referralLink,
        });
        // no-op on success
      } catch (err) {
        // user cancelled or failed - fallback to clipboard
        try {
          await navigator.clipboard.writeText(shareText);
          alert('Nội dung chia sẻ đã được sao chép vào clipboard.');
        } catch (e) {
          alert('Không thể chia sẻ — vui lòng sao chép thủ công: ' + referralLink);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Nội dung chia sẻ đã được sao chép vào clipboard.');
      } catch (err) {
        alert('Trình duyệt không hỗ trợ chia sẻ, vui lòng sao chép thủ công: ' + referralLink);
      }
    }
  };

  const handleCopyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      alert('Mã giới thiệu/link đã được sao chép vào clipboard.');
    } catch (err) {
      alert('Không thể sao chép tự động, vui lòng sao chép: ' + referralLink);
    }
  };

  return (
    <Container className="welcome-tab py-4 px-2 px-md-4">
      {/* Row 1: Full width banners */}
      <Row>
        <Col xs={12}>
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
        </Col>
      </Row>

      {/* Row 2: Main content and sidebar */}
      <Row className="mt-4 mb-4">
        {/* Main Content */}
        <Col lg={9} md={12}>
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
                      {quest.id === 1 ? (
                        <span className={quest.completed ? 'text-success' : 'text-primary'}>
                          {quest.completed ? 'Hoàn thành!' : ''}
                        </span>
                      ) : (
                        <span className={quest.completed ? 'text-success' : 'text-primary'}>
                          {quest.completed ? 'Hoàn thành!' : (() => {
                            const pct = quest.total && quest.total > 0 ? Math.round((quest.progress / quest.total) * 100) : 0;
                            return `${pct}%`;
                          })()}
                        </span>
                      )}
                    </div>
                    <div className="quest-progress-bar">
                      <div 
                        className="quest-progress-fill"
                        style={{ width: `${quest.total && quest.total > 0 ? (quest.progress / quest.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Study Tip - moved from sidebar into main content per design */}
          <StudyTip />

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
                <button className="btn btn-invite-primary" onClick={handleInviteShare}>
                  👥 Mời bạn cùng học
                </button>
                <button className="btn btn-invite-secondary" onClick={handleCopyReferral}>
                  📱 Chia sẻ
                </button>
              </div>
            </div>
          </div>
          

        </Col>

        {/* Sidebar */}
        <Col lg={3} md={12} className="mt-3 mt-lg-0">
          {/* Important Dates Section - Sử dụng Timeline component giống Dates Tab */}
          <div className="important-dates-card">
            <h3 className="important-dates-title">📌 Ngày quan trọng</h3>
            {courseDateBlocks && courseDateBlocks.length > 0 ? (
              <Timeline />
            ) : (
              <div className="text-center py-4 text-muted">
                <Spinner animation="border" size="sm" className="mr-2" />
                <span>Đang tải ngày quan trọng...</span>
              </div>
            )}
          </div>

          <StreakCalendar 
            streakDays={userStats.streakDays} 
            lastDayOfStreak={userStats.lastDayOfStreak}
          />
          
          {loadingStreaks ? (
            <div className="group-streaks-loading text-center p-3">
              <Spinner animation="border" size="sm" />
              <span className="ms-2 text-muted">Đang tải chuỗi nhóm...</span>
            </div>
          ) : (
            <GroupStreaks groups={groupStreaks} disableFallback={true} />
          )}
          
          {/* StudyTip removed from sidebar (moved into main content) */}

          {/* Referral widget: only show when the feature is enabled (temporarily hide otherwise) */}
          {referralEnabled && <ReferralWidget />}
        </Col>
      </Row>
    </Container>
  );
};

export default WelcomeTab;

