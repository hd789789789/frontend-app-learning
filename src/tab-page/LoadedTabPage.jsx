import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';

import { getConfig } from '@edx/frontend-platform';
import { Hyperlink, useToggle } from '@openedx/paragon';

import { CourseTabsNavigation } from '../course-tabs';
import { useModel } from '../generic/model-store';
import { AlertList } from '../generic/user-messages';
import StreakModal from '../shared/streak-celebration';
import InstructorToolbar from '../instructor-toolbar';
import useEnrollmentAlert from '../alerts/enrollment-alert';
import useLogistrationAlert from '../alerts/logistration-alert';

import ProductTours from '../product-tours/ProductTours';

const LoadedTabPage = ({
  activeTabSlug,
  children,
  courseId,
  metadataModel,
  unitId,
}) => {
  const {
    celebrations,
    org,
    originalUserIsStaff,
    tabs: originalTabs,
    title,
    verifiedMode,
    hasCourseAuthorAccess,
  } = useModel('courseHomeMeta', courseId);

  // Thêm tab Chào mừng vào đầu danh sách tabs
  const welcomeTab = {
    title: '👋 Chào mừng',
    slug: 'welcome',
    url: `/learning/course/${courseId}/welcome`,
  };

  // Thêm tab Thành tích vào danh sách tabs
  // URL phải có prefix /learning giống như các tab khác
  const badgeTab = {
    title: '🏅 Thành tích',
    slug: 'badge',
    url: `/learning/course/${courseId}/badge`,
  };

  const studyGroupsTab = {
    title: '👥 Nhóm học tập',
    slug: 'study-groups',
    url: `/learning/course/${courseId}/study-groups`,
  };
  
  // Thêm tab Thành tích sau tab Leaderboard (Xếp hạng) và ẩn tab Progress
  // Đảm bảo tab Discussions hiển thị với URL đúng định dạng
  const tabs = React.useMemo(() => {
    // Nếu metadata tabs không có (hoặc lỗi gọi API), tạo danh sách tabs mặc định
    if (!originalTabs || originalTabs.length === 0) {
      return [
        welcomeTab,
        {
          title: '📚 Khóa học',
          slug: 'outline',
          url: `/learning/course/${courseId}/home`,
        },
        studyGroupsTab,
        badgeTab,
        {
          title: '🏆 Xếp hạng',
          slug: 'leaderboard',
          url: `/learning/course/${courseId}/leaderboard`,
        },
      ];
    }

    // Filter out progress tab, dates tab, and discussion tab (tạm thời ẩn)
    let tabsCopy = originalTabs.filter(tab => 
      tab.slug !== 'progress' && 
      tab.slug !== 'dates' && 
      tab.slug !== 'discussion'
    );
    
    // Cập nhật URL và title cho các tab
    tabsCopy = tabsCopy.map(tab => {
      // Thêm emoji icon cho tab Khóa học (outline hoặc courseware)
      // Kiểm tra cả slug và title để đảm bảo bắt được tất cả các trường hợp
      if (tab.slug === 'outline' || tab.slug === 'courseware' || tab.type === 'courseware' || 
          (tab.title && (tab.title.includes('Khóa học') || tab.title.includes('Khoá học')) && !tab.title.includes('📚'))) {
        return {
          ...tab,
          title: '📚 Khóa học',
        };
      }
      // Đổi tên tab Leaderboard thành "Xếp hạng" (giữ nguyên emoji nếu có)
      if (tab.slug === 'leaderboard') {
        // Giữ emoji nếu title từ backend có emoji, nếu không thì thêm emoji
        const hasEmoji = /^[\u{1F300}-\u{1F9FF}]/u.test(tab.title || '');
        return {
          ...tab,
          title: hasEmoji ? tab.title.replace(/Học đua/g, 'Xếp hạng') : '🏆 Xếp hạng',
        };
      }
      // Tạm thời ẩn tab Discussion
      // Đổi tên tab Discussion thành "Thảo luận" và redirect đến discussions MFE
      // if (tab.slug === 'discussion') {
      //   // URL sẽ là /learning/course/:courseId/discussion để trigger DiscussionTab component
      //   // DiscussionTab sẽ redirect đến discussions MFE
      //   const discussionUrl = `/learning/course/${courseId}/discussion/posts`;
      //   return {
      //     ...tab,
      //     url: discussionUrl,
      //     title: 'Thảo luận',
      //   };
      // }
      // Tạm thời ẩn tab Dates
      // Đổi tên tab Dates thành "Ngày"
      // if (tab.slug === 'dates') {
      //   return {
      //     ...tab,
      //     title: 'Ngày',
      //   };
      // }
      // Đổi tên tab Teams thành "Nhóm" và cập nhật URL
      if (tab.slug === 'teams' || tab.type === 'teams') {
        // Cập nhật URL để sử dụng định dạng learning route
        let teamsUrl = tab.url;
        if (teamsUrl) {
          // Nếu URL chứa /courses/.../teams_dashboard, chuyển sang định dạng learning
          if (teamsUrl.includes('/courses/') && teamsUrl.includes('/teams_dashboard')) {
            teamsUrl = `/learning/course/${courseId}/teams`;
          } else if (!teamsUrl.includes('/learning/') && !teamsUrl.includes('/course/')) {
            // Nếu URL không có prefix, thêm learning prefix
            teamsUrl = `/learning/course/${courseId}/teams`;
          }
        } else {
          // Nếu không có URL, tạo URL mặc định
          teamsUrl = `/learning/course/${courseId}/teams`;
        }
        return {
          ...tab,
          url: teamsUrl,
          title: 'Nhóm',
        };
      }
      return tab;
    });
    
    // Tạm thời ẩn tab discussion
    // Đảm bảo tab discussion có trong danh sách, nếu không có thì thêm vào
    // const hasDiscussionTab = tabsCopy.some(tab => tab.slug === 'discussion');
    // if (!hasDiscussionTab) {
    //   const discussionTab = {
    //     title: 'Thảo luận',
    //     slug: 'discussion',
    //     url: `/learning/course/${courseId}/discussion/forum/`,
    //     type: 'discussion',
    //   };
    //   tabsCopy.push(discussionTab);
    // }
    
    const leaderboardIndex = tabsCopy.findIndex(tab => tab.slug === 'leaderboard');
    const outlineIndex = tabsCopy.findIndex(tab =>
      tab.slug === 'outline' ||
      tab.slug === 'courseware' ||
      tab.type === 'courseware',
    );
    
    // Thêm tab Thành tích trước tab Xếp hạng (leaderboard)
    if (leaderboardIndex !== -1) {
      // Chèn Thành tích trước leaderboard
      tabsCopy.splice(leaderboardIndex, 0, badgeTab);
    } else {
      // Nếu không có leaderboard, thêm vào cuối
      tabsCopy.push(badgeTab);
    }

    // Thêm tab Nhóm học tập sau tab Khóa học (outline / courseware)
    if (outlineIndex !== -1) {
      tabsCopy.splice(outlineIndex + 1, 0, studyGroupsTab);
    } else {
      // Nếu không tìm được tab Khóa học, thêm Nhóm học tập vào đầu (sẽ đẩy xuống sau Chào mừng)
      tabsCopy.unshift(studyGroupsTab);
    }
    
    // Thêm tab Chào mừng vào đầu danh sách
    tabsCopy.unshift(welcomeTab);
    
    return tabsCopy;
  }, [originalTabs, courseId, badgeTab, studyGroupsTab, welcomeTab]);

  // Logistration and enrollment alerts are only really used for the outline tab, but loaded here to put them above
  // breadcrumbs when they are visible.
  const logistrationAlert = useLogistrationAlert(courseId);
  const enrollmentAlert = useEnrollmentAlert(courseId);

  const activeTab = tabs.filter(tab => tab.slug === activeTabSlug)[0];

  const streakLengthToCelebrate = celebrations && celebrations.streakLengthToCelebrate;
  const streakDiscountCouponEnabled = celebrations && celebrations.streakDiscountEnabled && verifiedMode;
  const [isStreakCelebrationOpen,, closeStreakCelebration] = useToggle(streakLengthToCelebrate);

  return (
    <>
      <ProductTours
        activeTab={activeTabSlug}
        courseId={courseId}
        isStreakCelebrationOpen={isStreakCelebrationOpen}
        org={org}
      />
      <Helmet>
        <title>{`${activeTab ? `${activeTab.title} | ` : ''}${title} | ${getConfig().SITE_NAME}`}</title>
      </Helmet>
      {originalUserIsStaff && (
        <InstructorToolbar
          courseId={courseId}
          unitId={unitId}
          tab={activeTabSlug}
          isStudioButtonVisible={hasCourseAuthorAccess}
        />
      )}
      <StreakModal
        courseId={courseId}
        metadataModel={metadataModel}
        streakLengthToCelebrate={streakLengthToCelebrate}
        isStreakCelebrationOpen={!!isStreakCelebrationOpen}
        closeStreakCelebration={closeStreakCelebration}
        streakDiscountCouponEnabled={streakDiscountCouponEnabled}
        verifiedMode={verifiedMode}
      />
      <main className="d-flex flex-column flex-grow-1">
        <AlertList
          topic="outline"
          className="mx-5 mt-3"
          customAlerts={{
            ...enrollmentAlert,
            ...logistrationAlert,
          }}
        />
        <div className="container-xl mt-2 mb-1">
          <nav aria-label="Breadcrumb" style={{ fontSize: '0.875rem' }}>
            <Hyperlink
              destination={`${getConfig().LMS_BASE_URL}/dashboard`}
              style={{ color: '#707070', textDecoration: 'none' }}
            >
              ← Khóa học của tôi
            </Hyperlink>
            <span style={{ color: '#aaa', margin: '0 0.5rem' }}>/</span>
            <span style={{ color: '#333' }}>{title}</span>
          </nav>
        </div>
        <CourseTabsNavigation tabs={tabs} className="mb-3" activeTabSlug={activeTabSlug} />
        <div id="main-content" className="container-xl">
          {children}
        </div>
      </main>
    </>
  );
};

LoadedTabPage.propTypes = {
  activeTabSlug: PropTypes.string.isRequired,
  children: PropTypes.node,
  courseId: PropTypes.string.isRequired,
  metadataModel: PropTypes.string,
  unitId: PropTypes.string,
};

LoadedTabPage.defaultProps = {
  children: null,
  metadataModel: 'courseHomeMeta',
  unitId: null,
};

export default LoadedTabPage;
