import React, { useState, useEffect, useMemo, useRef, memo } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Container, Spinner, Alert, Row, Col } from "@openedx/paragon";
import { useModel } from "../../generic/model-store";
import { fetchProgressTab, fetchWelcomeTab } from "../../course-home/data";
import StreakCalendar from "../welcome-tab/StreakCalendar";
import GroupStreaks from "../welcome-tab/GroupStreaks";
import StudyTip from "../welcome-tab/StudyTip";
import ReferralWidget from "../welcome-tab/ReferralWidget";
import CompletionDonutChart from "../progress-tab/course-completion/CompletionDonutChart";
import './BadgeTab.scss';

// Circular Progress Component - Memoized to prevent unnecessary re-renders
const CircularProgress = memo(({ percent = 0 }) => {
  // Ensure percent is a valid number between 0 and 100
  const validPercent = Math.max(0, Math.min(100, isNaN(percent) ? 0 : percent));
  
  // SVG circle calculations
  const radius = 100;
  const circumference = Math.PI * radius * 2; // 2 * PI * r
  const strokeDashoffset = circumference - (validPercent / 100) * circumference;
  
  // Outer ring calculations (larger circle)
  const outerRadius = 110;
  const outerCircumference = Math.PI * outerRadius * 2;
  const outerStrokeDashoffset = outerCircumference - (validPercent / 100) * outerCircumference;
  
  return (
    <div className="circular-progress-wrapper">
      <svg 
        width="250" 
        height="250" 
        viewBox="0 0 250 250"
        className="progress-svg"
        style={{ display: 'block' }}
      >
        {/* Outer background circle - always visible */}
        <circle 
          cx="125" 
          cy="125" 
          r={outerRadius}
          fill="none"
          stroke="#F0F0F0"
          strokeWidth="8"
          style={{ opacity: 1 }}
        />
        {/* Outer progress circle - shows progress */}
        <circle 
          cx="125" 
          cy="125" 
          r={outerRadius}
          fill="none"
          stroke="#81C784"
          strokeWidth="8"
          strokeDasharray={outerCircumference}
          strokeDashoffset={outerStrokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 125 125)"
          className="progress-circle-outer"
          style={{ 
            transition: 'stroke-dashoffset 0.5s ease',
            opacity: 1,
            visibility: 'visible'
          }}
        />
        {/* Inner background circle */}
        <circle 
          cx="125" 
          cy="125" 
          r={radius}
          fill="none"
          stroke="#E0E0E0"
          strokeWidth="20"
        />
        {/* Inner progress circle */}
        <circle 
          cx="125" 
          cy="125" 
          r={radius}
          fill="none"
          stroke="#2ECC71"
          strokeWidth="20"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 125 125)"
          className="progress-circle-fill"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      {/* Text overlay */}
      <div className="progress-text-overlay">
        <div className="progress-percentage-text">
          {Math.round(validPercent)}%
        </div>
        <div className="progress-label-text">
          Hoàn thành
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if percent actually changes
  const prevPercent = Math.round(prevProps.percent || 0);
  const nextPercent = Math.round(nextProps.percent || 0);
  return prevPercent === nextPercent;
});

CircularProgress.displayName = 'CircularProgress';

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

// Memoize BadgeTab to prevent unnecessary re-renders
const BadgeTab = memo(function BadgeTab() {
    const { courseId } = useParams();
    const dispatch = useDispatch();
  
  // Debug: Track render count
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  console.log(`[BadgeTab] Render #${renderCountRef.current} - courseId: ${courseId}`);
  
  // Use stable selectors to prevent re-renders
  const courseStatus = useSelector((state) => state.courseHome?.courseStatus || 'loading');
  const progressModel = useModel('progress', courseId);
  const welcomeModel = useModel('welcome', courseId);
  
  console.log(`[BadgeTab] Render #${renderCountRef.current} - courseStatus: ${courseStatus}, progressModel: ${!!progressModel}, welcomeModel: ${!!welcomeModel}`);
    
  const [rewardFilter, setRewardFilter] = useState('all');
  const [rewards] = useState(mockRewards);
    
  // Use refs to track if we've already initiated fetch to prevent multiple fetches
  // Initialize lastCourseIdRef with current courseId to prevent false "courseId changed" detection
  const lastCourseIdRef = useRef(courseId);
  const progressFetchingRef = useRef(false);
  const welcomeFetchingRef = useRef(false);
  const hasMountedRef = useRef(false);
    
  // Check loading state - only show loading spinner if courseStatus is explicitly 'loading'
  // Don't show loading if we're just waiting for data to populate
  const loading = courseStatus === 'loading' && !progressModel && !welcomeModel;
  
  // Check if data is already loaded in model store - memoize to prevent recalculation
  const progressDataLoaded = useMemo(() => {
    const loaded = !!(progressModel?.completionSummary);
    console.log(`[BadgeTab] progressDataLoaded calculated: ${loaded} - render #${renderCountRef.current}, completionSummary: ${!!progressModel?.completionSummary}`);
    return loaded;
  }, [progressModel?.completionSummary]);

  const welcomeDataLoaded = useMemo(() => {
    const loaded = !!(welcomeModel?.userStats);
    console.log(`[BadgeTab] welcomeDataLoaded calculated: ${loaded} - render #${renderCountRef.current}, userStats: ${!!welcomeModel?.userStats}`);
    return loaded;
  }, [welcomeModel?.userStats]);
  
  // Get real user stats from welcome API if available
  const welcomeData = welcomeModel || {};
  const userStats = welcomeData.userStats || {};
  
  // Get completion percentage from progress data
  const completionPercent = progressModel?.completionSummary?.percent || 0;
  
  // Calculate certificates with real data using useMemo to avoid unnecessary re-renders
  const certificates = useMemo(() => {
    return {
      ...mockCertificates,
      courseCompletion: {
        ...mockCertificates.courseCompletion,
        progress: Math.round(completionPercent),
      },
    };
  }, [completionPercent]);
  
  // Merge real data with mock data using useMemo
  const stats = useMemo(() => ({
    level: mockStats.level,
    xp: mockStats.xp,
    xpToNextLevel: mockStats.xpToNextLevel,
    coins: mockStats.coins,
    badges: mockStats.badges,
    streakDays: userStats.streakDays || mockStats.streakDays,
    completedLessons: mockStats.completedLessons,
    averageScore: mockStats.averageScore,
    classRank: userStats.classRank || mockStats.classRank,
  }), [userStats.streakDays, userStats.classRank]);

  // Fetch progress and welcome data only once when component mounts or courseId changes
  // Use refs to prevent multiple simultaneous fetches and re-renders
  useEffect(() => {
    console.log(`[BadgeTab] useEffect triggered - courseId: ${courseId}, lastCourseId: ${lastCourseIdRef.current}, renderCount: ${renderCountRef.current}`);
    
    if (!courseId) {
      console.log(`[BadgeTab] No courseId, skipping fetch`);
      return;
    }

    // Reset refs when courseId changes (only if actually changed)
    const courseIdChanged = courseId !== lastCourseIdRef.current;
    if (courseIdChanged) {
      console.log(`[BadgeTab] CourseId changed from ${lastCourseIdRef.current} to ${courseId}, resetting refs`);
      progressFetchingRef.current = false;
      welcomeFetchingRef.current = false;
      hasMountedRef.current = false;
    } else {
      console.log(`[BadgeTab] CourseId unchanged: ${courseId}, keeping refs`);
    }
    
    // Always update lastCourseIdRef to current courseId
    lastCourseIdRef.current = courseId;
    
    // Mark as mounted after first check (only once per courseId)
    if (!hasMountedRef.current) {
      console.log(`[BadgeTab] First mount for courseId: ${courseId}`);
      hasMountedRef.current = true;
    }
    
    // Check if data is already loaded in model store - use stable references
    const isProgressLoaded = !!(progressModel?.completionSummary);
    const isWelcomeLoaded = !!(welcomeModel?.userStats);
    
    console.log(`[BadgeTab] Data check - isProgressLoaded: ${isProgressLoaded}, isWelcomeLoaded: ${isWelcomeLoaded}, progressFetching: ${progressFetchingRef.current}, welcomeFetching: ${welcomeFetchingRef.current}`);
    
    // Only fetch progress data if:
    // 1. Data is not already loaded
    // 2. We haven't already initiated a fetch for this courseId
    if (!isProgressLoaded && !progressFetchingRef.current) {
      console.log(`[BadgeTab] Fetching progress data for courseId: ${courseId}`);
      progressFetchingRef.current = true;
      const promise = dispatch(fetchProgressTab(courseId));
      if (promise && typeof promise.finally === 'function') {
        promise.finally(() => {
          console.log(`[BadgeTab] Progress fetch completed for courseId: ${courseId}`);
          progressFetchingRef.current = false;
        });
      } else {
        console.log(`[BadgeTab] Progress fetch promise not available, resetting flag`);
        progressFetchingRef.current = false;
      }
    } else {
      console.log(`[BadgeTab] Skipping progress fetch - isProgressLoaded: ${isProgressLoaded}, progressFetching: ${progressFetchingRef.current}`);
    }
    
    // Only fetch welcome data if:
    // 1. Data is not already loaded
    // 2. We haven't already initiated a fetch for this courseId
    if (!isWelcomeLoaded && !welcomeFetchingRef.current) {
      console.log(`[BadgeTab] Fetching welcome data for courseId: ${courseId}`);
      welcomeFetchingRef.current = true;
      const promise = dispatch(fetchWelcomeTab(courseId));
      if (promise && typeof promise.finally === 'function') {
        promise.finally(() => {
          console.log(`[BadgeTab] Welcome fetch completed for courseId: ${courseId}`);
          welcomeFetchingRef.current = false;
        });
      } else {
        console.log(`[BadgeTab] Welcome fetch promise not available, resetting flag`);
        welcomeFetchingRef.current = false;
      }
    } else {
      console.log(`[BadgeTab] Skipping welcome fetch - isWelcomeLoaded: ${isWelcomeLoaded}, welcomeFetching: ${welcomeFetchingRef.current}`);
    }
    // Only depend on courseId and dispatch - don't depend on models to prevent re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, dispatch]);

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

  // Get progress data for display - memoized to prevent recalculation
  const completionSummary = useMemo(() => {
    return progressModel?.completionSummary || {};
  }, [progressModel?.completionSummary]);
  
  const courseGrade = useMemo(() => {
    return progressModel?.courseGrade || {};
  }, [progressModel?.courseGrade]);
  
  const sectionScores = useMemo(() => {
    return progressModel?.sectionScores || [];
  }, [progressModel?.sectionScores]);
  
  // Calculate total lessons by counting subsections from section_scores
  // This is more accurate than using completion_summary which might miss some subsections
  // Use useMemo to prevent recalculation on every render
  const totalLessons = useMemo(() => {
    return sectionScores.reduce((total, section) => {
      return total + (section.subsections?.length || 0);
    }, 0);
  }, [sectionScores]);
  
  // Get counts from completion_summary for status breakdown - memoized
  const completeCount = useMemo(() => completionSummary.completeCount || 0, [completionSummary.completeCount]);
  const incompleteCount = useMemo(() => completionSummary.incompleteCount || 0, [completionSummary.incompleteCount]);
  const lockedCount = useMemo(() => completionSummary.lockedCount || 0, [completionSummary.lockedCount]);
  
  const completedLessons = completeCount;
  const inProgressLessons = incompleteCount;
  const notStartedLessons = lockedCount;
  
  // Calculate progress percentage - memoized to prevent recalculation
  // Always ensure we have a valid number (0-100)
  const progressPercent = useMemo(() => {
    // Calculate from actual data
    const calculatedPercent = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;
    
    // Use API percent if available and valid (greater than 0), otherwise use calculated
    const apiPercent = completionPercent && !isNaN(completionPercent) && completionPercent > 0 
      ? Math.round(completionPercent) 
      : null;
    
    const displayPercent = apiPercent !== null ? apiPercent : calculatedPercent;
    const finalPercent = Math.max(0, Math.min(100, displayPercent));
    
    // Ensure we always return a valid number
    return isNaN(finalPercent) ? 0 : finalPercent;
  }, [totalLessons, completedLessons, completionPercent]);
  
  // Get grade data - memoized
  const currentGrade = useMemo(() => courseGrade.percent || 0, [courseGrade.percent]);
  const passingGrade = 50; // Mock data - should come from API

    if (loading) {
        return (
      <Container className="badge-tab py-5 px-2 px-md-4 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Đang tải dữ liệu Thành tích...</p>
            </Container>
        );
    }

  // Mock group streaks data (same as WelcomeTab)
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

        return (
    <Container className="badge-tab py-4 px-0">
      <Row className="mx-0">
        {/* Main Content */}
        <Col lg={8} md={12} className="px-1 px-md-2">
          {/* Progress Section - Moved to top */}
          <div className="progress-section">
            <h3 className="progress-section-title">📈 Tiến độ</h3>
            <div className="progress-overview">
              <div className="circular-progress">
                <CircularProgress percent={progressPercent || 0} />
              </div>
              <div className="progress-stats">
                <div className="progress-stats-section">
                  <h4 className="progress-stats-title">Thống kê học tập</h4>
                  <div className="progress-stats-list">
                    <div className="progress-stat-item">
                      <span>Tổng số bài học:</span>
                      <strong>{totalLessons} bài</strong>
                    </div>
                    <div className="progress-stat-item">
                      <span>Đã hoàn thành:</span>
                      <strong style={{ color: '#27AE60' }}>{completedLessons} bài</strong>
                    </div>
                    <div className="progress-stat-item">
                      <span>Đang học:</span>
                      <strong style={{ color: '#E67E22' }}>{inProgressLessons} bài</strong>
                    </div>
                    <div className="progress-stat-item">
                      <span>Chưa bắt đầu:</span>
                      <strong style={{ color: '#7F8C8D' }}>{notStartedLessons} bài</strong>
                    </div>
                  </div>
                </div>
                <div className="weekly-goal">
                  <strong>Mục tiêu tuần này</strong>
                  <div className="weekly-goal-text">
                    Hoàn thành 5 bài học để nhận danh hiệu "Người học chăm chỉ" 🌟
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '60%' }}></div>
                  </div>
                  <div className="weekly-goal-progress">3/5 bài</div>
                </div>
              </div>
            </div>
          </div>

          {/* Grade Section - Moved to top */}
          <div className="grade-section">
            <h3 className="grade-section-title">📝 Điểm</h3>
            <p className="grade-section-description">
              Đây là điểm có trọng số của bạn so với điểm cần thiết để vượt qua khóa học này.
            </p>
            
            {/* Grade Slider */}
            <div className="grade-slider">
              <div className="grade-slider-header">
                <div className="grade-slider-start">0%</div>
                <div className="grade-slider-label">Điểm hiện tại của bạn</div>
              </div>
              <div className="grade-slider-track">
                <div 
                  className="grade-slider-indicator"
                  style={{ left: `${Math.min(100, Math.max(0, currentGrade))}%` }}
                >
                  Điểm đạt: {currentGrade}%
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="grade-warning">
              <div className="grade-warning-icon">⚠️</div>
              <div className="grade-warning-content">
                <strong>Điểm có trọng số {passingGrade}% là bắt buộc để vượt qua khóa học này</strong>
                <div className="grade-warning-info">Nhấn để xem thêm thông tin ⓘ</div>
              </div>
            </div>

            {/* Grade Summary Table */}
            <h4 className="grade-summary-title">
              Tóm tắt điểm
              <span className="grade-info-icon">ⓘ</span>
            </h4>
            <div className="grade-table-wrapper">
              <table className="grade-table">
                <thead>
                  <tr>
                    <th>Loại bài tập</th>
                    <th>Trọng số</th>
                    <th>Điểm</th>
                    <th>Điểm có trọng số</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Bài tập về nhà <sup>1</sup></td>
                    <td>15%</td>
                    <td>0%</td>
                    <td>0%</td>
                  </tr>
                  <tr>
                    <td>Bài Lab <sup>2</sup></td>
                    <td>15%</td>
                    <td>0%</td>
                    <td>0%</td>
                  </tr>
                  <tr>
                    <td>Kiểm tra giữa kỳ</td>
                    <td>30%</td>
                    <td>0%</td>
                    <td>0%</td>
                  </tr>
                  <tr>
                    <td>Kiểm tra cuối kỳ</td>
                    <td>40%</td>
                    <td>0%</td>
                    <td>0%</td>
                  </tr>
                  <tr className="grade-table-total">
                    <td>
                      Tổng kết điểm có trọng số hiện tại của bạn
                      <span className="grade-info-icon">ⓘ</span>
                    </td>
                    <td colSpan="3" className="grade-total-value">{currentGrade}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footnotes */}
            <div className="grade-footnotes">
              <div>
                <sup>1</sup><span>2 điểm Bài tập về nhà thấp nhất được loại bỏ.</span>
              </div>
              <div>
                <sup>2</sup><span>2 điểm Bài Lab thấp nhất được loại bỏ.</span>
              </div>
            </div>

            {/* Grade Details */}
            <h4 className="grade-details-title">Điểm chi tiết</h4>
            <div className="grade-details">
              <ul>
                <li>
                  <strong>Điểm luyện tập</strong> không có các hoạt động chưa có điểm dành cho luyện tập và tự đánh giá.
                </li>
                <li>
                  <strong>Điểm đã chấm</strong> không có các hoạt động đã bị hủy hoặc chưa gửi vào bài làm cuối kỳ của bạn.
                </li>
              </ul>
              <p className="grade-details-note">
                Để xem tiến độ các khía cạnh không chấm điểm của khóa học, hãy xem{' '}
                <a href="#" className="grade-details-link">Bảng điều khiển khóa học</a> của bạn.
              </p>
            </div>
          </div>

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
        </Col>

        {/* Sidebar */}
        <Col lg={4} md={12} className="px-1 px-md-2">
          <StreakCalendar 
            streakDays={stats.streakDays} 
            lastDayOfStreak={userStats.lastDayOfStreak}
          />
          
          <GroupStreaks groups={groupStreaks} />
          
          <StudyTip />
          
          <ReferralWidget />
        </Col>
      </Row>
        </Container>
    );
});

BadgeTab.displayName = 'BadgeTab';

export default BadgeTab;
