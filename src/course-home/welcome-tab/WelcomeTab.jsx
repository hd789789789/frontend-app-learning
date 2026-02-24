import React, { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Spinner, Alert, Row, Col } from '@openedx/paragon';
import { useModel } from '../../generic/model-store';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import Timeline from '../dates-tab/timeline/Timeline';
import { fetchDatesTab, fetchProgressTab, fetchStudyGroupsTab, fetchWelcomeTab, fetchLeaderboardTab } from '../data';
import { getGroupStreaks, getStudyGroupComments, getStudyGroupsTabData } from '../data/api';
import StreakCalendar from './StreakCalendar';
import GroupStreaks from './GroupStreaks';
import StudyTip from './StudyTip';
import ReferralWidget from './ReferralWidget';
import './WelcomeTab.scss';

// Skeleton loading component for stats
const SkeletonStats = () => (
  <div className="stats-grid">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="stat-card">
        <div className="skeleton skeleton-stat-value" style={{ width: '50px', height: '40px', margin: '0 auto' }} />
        <div className="skeleton skeleton-stat-label" style={{ width: '80px', height: '20px', margin: '8px auto 0' }} />
      </div>
    ))}
  </div>
);

// Skeleton loading for quest card
const SkeletonQuestCard = () => (
  <div className="quest-card">
    <div className="quest-header">
      <div className="skeleton" style={{ width: '70px', height: '70px', borderRadius: '14px' }} />
      <div className="quest-info" style={{ flex: 1 }}>
        <div className="skeleton" style={{ width: '60%', height: '24px', marginBottom: '8px' }} />
        <div className="skeleton" style={{ width: '90%', height: '16px', marginBottom: '8px' }} />
        <div className="skeleton" style={{ width: '40%', height: '16px' }} />
      </div>
    </div>
    <div className="quest-progress">
      <div className="skeleton" style={{ width: '100%', height: '8px', borderRadius: '4px' }} />
    </div>
  </div>
);

// Skeleton loading for sidebar
const SkeletonSidebar = () => (
  <div className="sidebar-skeleton">
    <div className="skeleton" style={{ height: '200px', borderRadius: '12px', marginBottom: '16px' }} />
    <div className="skeleton" style={{ height: '150px', borderRadius: '12px', marginBottom: '16px' }} />
    <div className="skeleton" style={{ height: '180px', borderRadius: '12px' }} />
  </div>
);

// Initial loading state - shows skeleton UI immediately
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
  
  // Track which data has been loaded - start with true to show UI immediately
  const [dataLoaded, setDataLoaded] = useState({
    welcome: false,
    progress: false,
    dates: false,
    studyGroups: false,
    leaderboard: false,
    groupStreaks: false,
  });

  // Overall loading state - only show full spinner on first render before any data
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Check if we have any welcome data from the model store
  const hasWelcomeData = Boolean(welcomeData && welcomeData.success);
  const loading = courseStatus === 'loading' || !hasWelcomeData;
  const error = courseStatus === 'failed' ? 'Không thể tải dữ liệu Chào mừng' : null;

  // Mark initial load complete after first render
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoadComplete(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Use progress model early so hooks order remains stable
  const progressModel = useModel('progress', courseId) || {};
  const completionSummary = progressModel.completionSummary || {};
  const completeCount = completionSummary.completeCount || 0;
  const incompleteCount = completionSummary.incompleteCount || 0;
  const lockedCount = completionSummary.lockedCount || 0;
  const totalUnits = completeCount + incompleteCount + lockedCount || 0;
  // Leaderboard model - used to determine current user's class rank (sync with Leaderboard / Xếp hạng)
  const leaderboardModel = useModel('leaderboardTab', courseId) || {};

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

  // Track loading states for each data type
  const [loadingStudyGroupCheck, setLoadingStudyGroupCheck] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!currentUsername || !courseId) {
      setLoadingStudyGroupCheck(false);
      return undefined;
    }

    setLoadingStudyGroupCheck(true);
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
              if (!cancelled) {
                setHasPostedDiscussion(true);
                setLoadingStudyGroupCheck(false);
              }
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
              if (!cancelled) {
                setHasPostedDiscussion(true);
                setLoadingStudyGroupCheck(false);
              }
              return;
            }
          }
        } catch (err) {
          // ignore and continue
        }
      }

      if (!cancelled) {
        setHasPostedDiscussion(false);
        setLoadingStudyGroupCheck(false);
      }
    };

    checkPosted();
    return () => {
      cancelled = true;
    };
  }, [studyGroups, currentUsername, courseId, welcomeData]);
  
  // Fetch dates data để dùng Timeline component - lazy load
  const datesModel = useModel('dates', courseId) || {};
  const { courseDateBlocks } = datesModel;
  const [loadingDates, setLoadingDates] = useState(true);

  useEffect(() => {
    // Fetch dates data nếu chưa có
    if (courseId && !courseDateBlocks) {
      dispatch(fetchDatesTab(courseId)).then(() => {
        setDataLoaded(prev => ({ ...prev, dates: true }));
        setLoadingDates(false);
      }).catch(() => {
        setLoadingDates(false);
      });
    } else {
      setDataLoaded(prev => ({ ...prev, dates: true }));
      setLoadingDates(false);
    }
  }, [courseId, dispatch, courseDateBlocks]);

  // Ensure progress model is loaded (BadgeTab fetches it; WelcomeTab needs it too) - lazy load
  const progressFetchingRef = useRef(false);
  const [loadingProgress, setLoadingProgress] = useState(true);
  
  useEffect(() => {
    if (!courseId) return;
    const shouldFetchProgress = courseId && !progressFetchingRef.current && !(progressModel && progressModel.completionSummary);
    if (shouldFetchProgress) {
      progressFetchingRef.current = true;
      const p = dispatch(fetchProgressTab(courseId));
      if (p && typeof p.then === 'function') {
        p.then(() => {
          setDataLoaded(prev => ({ ...prev, progress: true }));
          setLoadingProgress(false);
        }).catch(() => {
          setLoadingProgress(false);
        });
        if (p && typeof p.finally === 'function') {
          p.finally(() => { progressFetchingRef.current = false; });
        } else {
          progressFetchingRef.current = false;
        }
      } else {
        progressFetchingRef.current = false;
        setDataLoaded(prev => ({ ...prev, progress: true }));
        setLoadingProgress(false);
      }
    } else {
      setDataLoaded(prev => ({ ...prev, progress: true }));
      setLoadingProgress(false);
    }
    // Only depend on courseId and dispatch to avoid loops caused by changing model references
  }, [courseId, dispatch]);

  // Ensure welcome data contains dailyQuests (refresh if backend didn't provide them) - lazy load
  const welcomeFetchingRef = useRef(false);
  const [loadingWelcome, setLoadingWelcome] = useState(true);
  
  useEffect(() => {
    if (!courseId) return;
    const hasDailyQuests = Boolean(welcomeData && welcomeData.dailyQuests && welcomeData.dailyQuests.length > 0);
    const shouldFetchWelcome = !hasDailyQuests && !welcomeFetchingRef.current;
    if (shouldFetchWelcome) {
      welcomeFetchingRef.current = true;
      const p = dispatch(fetchWelcomeTab(courseId));
      if (p && typeof p.then === 'function') {
        p.then(() => {
          setDataLoaded(prev => ({ ...prev, welcome: true }));
          setLoadingWelcome(false);
        }).catch(() => {
          setLoadingWelcome(false);
        });
        if (p && typeof p.finally === 'function') {
          p.finally(() => { welcomeFetchingRef.current = false; });
        } else {
          welcomeFetchingRef.current = false;
        }
      } else {
        welcomeFetchingRef.current = false;
        setDataLoaded(prev => ({ ...prev, welcome: true }));
        setLoadingWelcome(false);
      }
    } else {
      setDataLoaded(prev => ({ ...prev, welcome: true }));
      setLoadingWelcome(false);
    }
    // Only depend on courseId and dispatch to avoid continuous fetch loops
  }, [courseId, dispatch]);

  // Ensure study-groups model is loaded so we can inspect comments if backend provides them - lazy load
  const [loadingStudyGroups, setLoadingStudyGroups] = useState(true);
  
  useEffect(() => {
    const shouldFetchStudyGroups = courseId && !(studyGroupsModel && studyGroupsModel.results !== undefined);
    if (shouldFetchStudyGroups) {
      dispatch(fetchStudyGroupsTab(courseId)).then(() => {
        setDataLoaded(prev => ({ ...prev, studyGroups: true }));
        setLoadingStudyGroups(false);
      }).catch(() => {
        setLoadingStudyGroups(false);
      });
    } else {
      setDataLoaded(prev => ({ ...prev, studyGroups: true }));
      setLoadingStudyGroups(false);
    }
  }, [courseId, dispatch, studyGroupsModel]);

  // Ensure leaderboard model is loaded so we can show the current user's class rank - lazy load
  const leaderboardFetchingRef = useRef(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  
  useEffect(() => {
    if (!courseId) return;
    const hasLeaderboardData = Boolean(leaderboardModel && (leaderboardModel.topStudents !== undefined || leaderboardModel.summary !== undefined));
    const shouldFetchLeaderboard = courseId && !hasLeaderboardData && !leaderboardFetchingRef.current;
    if (shouldFetchLeaderboard) {
      leaderboardFetchingRef.current = true;
      const p = dispatch(fetchLeaderboardTab(courseId));
      if (p && typeof p.then === 'function') {
        p.then(() => {
          setDataLoaded(prev => ({ ...prev, leaderboard: true }));
          setLoadingLeaderboard(false);
        }).catch(() => {
          setLoadingLeaderboard(false);
        });
        if (p && typeof p.finally === 'function') {
          p.finally(() => { leaderboardFetchingRef.current = false; });
        } else {
          leaderboardFetchingRef.current = false;
        }
      } else {
        leaderboardFetchingRef.current = false;
        setDataLoaded(prev => ({ ...prev, leaderboard: true }));
        setLoadingLeaderboard(false);
      }
    } else {
      setDataLoaded(prev => ({ ...prev, leaderboard: true }));
      setLoadingLeaderboard(false);
    }
    // Only depend on courseId and dispatch to avoid loops caused by changing model object references
  }, [courseId, dispatch]);

  // Fetch group streaks - lazy load
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
        setDataLoaded(prev => ({ ...prev, groupStreaks: true }));
      }
    };

    fetchGroupStreaks();
  }, [courseId]);

  // If still in initial loading state and no data at all, show quick spinner
  if (loading && !initialLoadComplete) {
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

  // Prefer progress data from the Progress/Thành tích model when available so the Welcome tab stays in sync.
  const progressApiPercent = progressModel?.completionSummary?.percent;
  const calculatedPercent = totalUnits > 0 ? Math.round((completeCount / totalUnits) * 100) : 0;
  const displayCompletionPercent = (progressApiPercent !== undefined && progressApiPercent !== null && !isNaN(progressApiPercent) && progressApiPercent > 0)
    ? Math.round(progressApiPercent)
    : calculatedPercent;

  // Determine current user's class rank from leaderboard model when available, otherwise fall back to welcome data.
  const leaderboardCurrentRank = leaderboardModel?.currentUserRank?.rank
    || leaderboardModel?.currentUserEntry?.rank;

  // Try to find the user in different possible leaderboard arrays returned by APIs.
  let foundLeaderboardEntry = null;
  if (Array.isArray(leaderboardModel?.leaderboard) && leaderboardModel.leaderboard.length > 0) {
    foundLeaderboardEntry = leaderboardModel.leaderboard.find((s) => s.isCurrentUser || (s.username && s.username.toLowerCase() === currentUsername?.toLowerCase()));
  }
  if (!foundLeaderboardEntry && Array.isArray(leaderboardModel?.topStudents) && leaderboardModel.topStudents.length > 0) {
    foundLeaderboardEntry = leaderboardModel.topStudents.find((s) => s.isCurrentUser || (s.username && s.username.toLowerCase() === currentUsername?.toLowerCase()));
  }

  const displayClassRank = leaderboardCurrentRank
    || (foundLeaderboardEntry && (foundLeaderboardEntry.rank || foundLeaderboardEntry.rank === 0 ? foundLeaderboardEntry.rank : null))
    || userStats.classRank
    || 0;

  // Use daily quests from API when provided; merge missing/zero fields with local fallbacks.
  // If API returns no quests (empty array) fall back to computed defaults.
  const buildFallbackQuests = () => ([
    {
      id: 1,
      title: 'Hoàn thành khoá học',
      description: 'Hoàn thành Unit trong khoá học',
      reward: '+ XP',
      progress: completeCount,
      total: totalUnits,
      completed: totalUnits > 0 ? completeCount >= totalUnits : false,
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
  ]);

  let dailyQuests = [];
  if (welcomeData && Array.isArray(welcomeData.dailyQuests) && welcomeData.dailyQuests.length > 0) {
    // Merge API quests with local computed values where API values are missing or zero for key tasks
    dailyQuests = welcomeData.dailyQuests.map((q) => {
      const quest = { ...q };
      if (quest.id === 1) {
        // Prefer local progress (completeCount) unless API reports a positive progress value.
        quest.progress = (quest.progress !== undefined && quest.progress !== null && Number(quest.progress) > 0)
          ? quest.progress
          : completeCount;
        // treat total <= 0 as missing and replace with computed totalUnits
        quest.total = (quest.total !== undefined && quest.total !== null && Number(quest.total) > 0) ? quest.total : totalUnits;
        quest.completed = (quest.completed !== undefined && quest.completed !== null)
          ? quest.completed
          : (quest.total > 0 ? Number(quest.progress) >= Number(quest.total) : false);
      } else if (quest.id === 2) {
        quest.progress = (quest.progress !== undefined && quest.progress !== null) ? quest.progress : 0;
        quest.total = (quest.total !== undefined && quest.total !== null && Number(quest.total) > 0) ? quest.total : 5;
        quest.completed = (quest.completed !== undefined && quest.completed !== null)
          ? quest.completed
          : (quest.total > 0 ? quest.progress >= quest.total : false);
      } else if (quest.id === 3) {
        // Prefer local discussion state unless API reports progress > 0
        quest.progress = (quest.progress !== undefined && quest.progress !== null && Number(quest.progress) > 0)
          ? quest.progress
          : (hasPostedDiscussion ? 1 : 0);
        quest.total = (quest.total !== undefined && quest.total !== null && Number(quest.total) > 0) ? quest.total : 1;
        quest.completed = (quest.completed !== undefined && quest.completed !== null)
          ? quest.completed
          : Boolean(isEnrolled && (Number(quest.progress) > 0));
      }
      return quest;
    });
  } else {
    dailyQuests = buildFallbackQuests();
  }

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

  // Check if any critical data is still loading
  const isCriticalLoading = loadingProgress || loadingWelcome;

  return (
    <Container className="welcome-tab py-4 px-2 px-md-4">
      {/* Row 1: Full width banners */}
      <Row>
        <Col xs={12}>
          {/* Welcome Banner */}
          <div className="welcome-banner">
            <h2>Chào mừng trở lại, Pi! 👋</h2>
            <p>Hôm nay là ngày thứ {userStats.streakDays} trong chuỗi ngày học liên tiếp của bạn. Hãy tiếp tục phấn đấu!</p>
            
            {/* Show skeleton while loading, show actual data when loaded */}
            {isCriticalLoading ? (
              <SkeletonStats />
            ) : (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{userStats.streakDays}</div>
                  <div className="stat-label">🔥 Ngày liên tiếp</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{displayCompletionPercent}%</div>
                  <div className="stat-label">📈 Hoàn thành khóa học</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{completeCount}</div>
                  <div className="stat-label">🎯 Bài học đã hoàn thành</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">#{displayClassRank}</div>
                  <div className="stat-label">🏆 Xếp hạng lớp</div>
                </div>
              </div>
            )}
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
            {loadingDates ? (
              <div className="skeleton-dates">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton-timeline-item">
                    <div className="skeleton" style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ width: '60%', height: '14px', marginBottom: '4px' }} />
                      <div className="skeleton" style={{ width: '80%', height: '16px' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : courseDateBlocks && courseDateBlocks.length > 0 ? (
              <Timeline />
            ) : (
              <div className="text-center py-4 text-muted">
                <span>Không có ngày quan trọng</span>
              </div>
            )}
          </div>

          <StreakCalendar 
            streakDays={userStats.streakDays} 
            lastDayOfStreak={userStats.lastDayOfStreak}
          />
          
          {loadingStreaks ? (
            <div className="group-streaks-skeleton p-3">
              <div className="skeleton" style={{ height: '120px', borderRadius: '8px' }} />
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

