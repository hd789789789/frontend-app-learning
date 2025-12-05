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

  // Thêm tab Thành tích vào danh sách tabs
  // URL phải có prefix /learning giống như các tab khác
  const badgeTab = {
    title: 'Thành tích',
    slug: 'badge',
    url: `/learning/course/${courseId}/badge`,
  };
  
  // Thêm tab Thành tích sau tab Leaderboard (Học đua) và ẩn tab Progress
  // Đảm bảo tab Discussions hiển thị với URL đúng định dạng
  const tabs = React.useMemo(() => {
    if (!originalTabs) return [];
    // Filter out progress tab
    let tabsCopy = originalTabs.filter(tab => tab.slug !== 'progress');
    
    // Cập nhật URL và title cho các tab
    tabsCopy = tabsCopy.map(tab => {
      // Đổi tên tab Discussion thành "Thảo luận"
      if (tab.slug === 'discussion') {
        // Cập nhật URL để sử dụng định dạng learning route
        // Nếu URL cũ là /courses/.../discussion/forum/, chuyển thành /learning/course/.../discussion/forum/
        let discussionUrl = tab.url;
        if (discussionUrl) {
          // Nếu URL chứa /courses/.../discussion/, chuyển sang định dạng learning
          if (discussionUrl.includes('/courses/') && discussionUrl.includes('/discussion/')) {
            // Extract path sau /discussion/ từ URL cũ
            const match = discussionUrl.match(/\/discussion\/(.+)$/);
            const discussionPath = match ? match[1] : 'forum/';
            discussionUrl = `/learning/course/${courseId}/discussion/${discussionPath}`;
          } else if (!discussionUrl.includes('/learning/') && !discussionUrl.includes('/course/')) {
            // Nếu URL không có prefix, thêm learning prefix
            const pathMatch = discussionUrl.match(/discussion\/(.+)$/);
            const discussionPath = pathMatch ? pathMatch[1] : 'forum/';
            discussionUrl = `/learning/course/${courseId}/discussion/${discussionPath}`;
          }
        } else {
          // Nếu không có URL, tạo URL mặc định
          discussionUrl = `/learning/course/${courseId}/discussion/forum/`;
        }
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
      // Chèn sau leaderboard
      tabsCopy.splice(leaderboardIndex + 1, 0, badgeTab);
    } else {
      // Nếu không có leaderboard, thêm vào cuối
      tabsCopy.push(badgeTab);
    }
    return tabsCopy;
  }, [originalTabs, courseId]);

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
