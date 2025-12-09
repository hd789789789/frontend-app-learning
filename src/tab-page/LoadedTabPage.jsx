import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';

import { getConfig } from '@edx/frontend-platform';
import { useToggle } from '@openedx/paragon';

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
    title: 'Chào mừng',
    slug: 'welcome',
    url: `/learning/course/${courseId}/welcome`,
  };

  // Thêm tab Thành tích vào danh sách tabs
  // URL phải có prefix /learning giống như các tab khác
  const badgeTab = {
    title: 'Thành tích',
    slug: 'badge',
    url: `/learning/course/${courseId}/badge`,
  };

  const studyGroupsTab = {
    title: 'Nhóm học tập',
    slug: 'study-groups',
    url: `/learning/course/${courseId}/study-groups`,
  };
  
  // Thêm tab Thành tích sau tab Leaderboard (Học đua) và ẩn tab Progress
  // Đảm bảo tab Discussions hiển thị với URL đúng định dạng
  const tabs = React.useMemo(() => {
    // Nếu metadata tabs không có (hoặc lỗi gọi API), tạo danh sách tabs mặc định
    if (!originalTabs || originalTabs.length === 0) {
      return [
        welcomeTab,
        {
          title: 'Khóa học',
          slug: 'outline',
          url: `/learning/course/${courseId}/home`,
        },
        {
          title: 'Học đua',
          slug: 'leaderboard',
          url: `/learning/course/${courseId}/leaderboard`,
        },
        studyGroupsTab,
        badgeTab,
      ];
    }

    // Filter out progress tab
    let tabsCopy = originalTabs.filter(tab => tab.slug !== 'progress');
    
    // Cập nhật URL và title cho các tab
    tabsCopy = tabsCopy.map(tab => {
      // Đổi tên tab Discussion thành "Thảo luận" và redirect đến discussions MFE
      if (tab.slug === 'discussion') {
        // URL sẽ là /learning/course/:courseId/discussion để trigger DiscussionTab component
        // DiscussionTab sẽ redirect đến discussions MFE
        const discussionUrl = `/learning/course/${courseId}/discussion/posts`;
        return {
          ...tab,
          url: discussionUrl,
          title: 'Thảo luận',
        };
      }
      // Đổi tên tab Dates thành "Ngày"
      if (tab.slug === 'dates') {
        return {
          ...tab,
          title: 'Ngày',
        };
      }
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
    
    // Đảm bảo tab discussion có trong danh sách, nếu không có thì thêm vào
    const hasDiscussionTab = tabsCopy.some(tab => tab.slug === 'discussion');
    if (!hasDiscussionTab) {
      const discussionTab = {
        title: 'Thảo luận',
        slug: 'discussion',
        url: `/learning/course/${courseId}/discussion/forum/`,
        type: 'discussion',
      };
      tabsCopy.push(discussionTab);
    }
    
    const leaderboardIndex = tabsCopy.findIndex(tab => tab.slug === 'leaderboard');
    if (leaderboardIndex !== -1) {
      // Chèn Nhóm học tập và Thành tích cạnh leaderboard
      tabsCopy.splice(leaderboardIndex, 0, studyGroupsTab);
      tabsCopy.splice(leaderboardIndex + 2, 0, badgeTab);
    } else {
      // Nếu không có leaderboard, thêm vào cuối
      tabsCopy.push(studyGroupsTab, badgeTab);
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
