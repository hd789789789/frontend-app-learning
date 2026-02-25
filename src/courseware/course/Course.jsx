import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { useDispatch, useSelector } from 'react-redux';
import { getConfig } from '@edx/frontend-platform';
import { useLocation, useNavigate } from 'react-router-dom';
import { breakpoints, useWindowSize } from '@openedx/paragon';

import { AlertList } from '@src/generic/user-messages';
import { useModel } from '@src/generic/model-store';
import { getCoursewareOutlineSidebarSettings } from '../data/selectors';
import Chat from './chat/Chat';
import SidebarProvider from './sidebar/SidebarContextProvider';
import NewSidebarProvider from './new-sidebar/SidebarContextProvider';
import { NotificationsDiscussionsSidebarTriggerSlot } from '../../plugin-slots/NotificationsDiscussionsSidebarTriggerSlot';
import { CelebrationModal, shouldCelebrateOnSectionLoad, WeeklyGoalCelebrationModal } from './celebration';
import ContentTools from './content-tools';
import Sequence from './sequence';
import { CourseOutlineMobileSidebarTriggerSlot } from '../../plugin-slots/CourseOutlineMobileSidebarTriggerSlot';
import { CourseBreadcrumbsSlot } from '../../plugin-slots/CourseBreadcrumbsSlot';
import './Course.scss';

// Skeleton loading component for course content
const SkeletonCourseContent = () => (
  <div className="skeleton-course-content">
    {/* Breadcrumb skeleton */}
    <div className="d-flex align-items-center mb-3">
      <div className="skeleton me-2" style={{ width: '80px', height: '20px' }} />
      <div className="skeleton me-2" style={{ width: '20px', height: '20px' }} />
      <div className="skeleton me-2" style={{ width: '120px', height: '20px' }} />
      <div className="skeleton me-2" style={{ width: '20px', height: '20px' }} />
      <div className="skeleton" style={{ width: '100px', height: '20px' }} />
    </div>

    {/* Sequence content skeleton */}
    <div className="sequence-skeleton">
      <div className="skeleton mb-3" style={{ height: '48px', borderRadius: '8px' }} />
      <div className="skeleton mb-2" style={{ height: '24px', width: '60%' }} />
      <div className="skeleton mb-4" style={{ height: '200px', borderRadius: '8px' }} />

      {/* Unit navigation skeleton */}
      <div className="unit-nav-skeleton d-flex justify-content-between mt-4">
        <div className="skeleton" style={{ width: '120px', height: '40px', borderRadius: '8px' }} />
        <div className="skeleton" style={{ width: '120px', height: '40px', borderRadius: '8px' }} />
      </div>
    </div>
  </div>
);

const Course = ({
  courseId,
  sequenceId,
  unitId,
  nextSequenceHandler,
  previousSequenceHandler,
  unitNavigationHandler,
  windowWidth,
}) => {
  const course = useModel('coursewareMeta', courseId);
  const courseHomeMeta = useModel('courseHomeMeta', courseId) || {};
  const {
    celebrations,
    isStaff,
    isNewDiscussionSidebarViewEnabled,
    originalUserIsStaff,
  } = courseHomeMeta;
  const sequence = useModel('sequences', sequenceId);
  const section = useModel('sections', sequence ? sequence.sectionId : null);
  const { enableNavigationSidebar } = useSelector(getCoursewareOutlineSidebarSettings);
  const navigationDisabled = enableNavigationSidebar || (sequence?.navigationDisabled ?? false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Track initial load state - show skeleton until data is available
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Check if course and sequence data are available
  const hasCourseData = Boolean(course && course.id);
  const hasSequenceData = Boolean(sequence && sequence.id);
  const isLoading = !hasCourseData || !hasSequenceData;

  // Mark initial load complete after first render
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoadComplete(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!originalUserIsStaff && pathname.startsWith('/preview')) {
    const courseUrl = pathname.replace('/preview', '');
    navigate(courseUrl, { replace: true });
  }

  const pageTitleBreadCrumbs = [
    sequence,
    section,
    course,
  ].filter(element => element != null).map(element => element.title);

  // Below the tabs, above the breadcrumbs alerts (appearing in the order listed here)
  const dispatch = useDispatch();

  const [firstSectionCelebrationOpen, setFirstSectionCelebrationOpen] = useState(false);
  // If streakLengthToCelebrate is populated, that modal takes precedence. Wait til the next load to display
  // the weekly goal celebration modal.
  const [weeklyGoalCelebrationOpen, setWeeklyGoalCelebrationOpen] = useState(
    celebrations && !celebrations.streakLengthToCelebrate && celebrations.weeklyGoal,
  );
  const shouldDisplayChat = windowWidth >= breakpoints.medium.minWidth;
  const daysPerWeek = course?.courseGoals?.selectedGoal?.daysPerWeek;

  useEffect(() => {
    const celebrateFirstSection = celebrations && celebrations.firstSection;
    setFirstSectionCelebrationOpen(shouldCelebrateOnSectionLoad(
      courseId,
      sequenceId,
      celebrateFirstSection,
      dispatch,
      celebrations,
    ));
  }, [sequenceId]);

  const SidebarProviderComponent = isNewDiscussionSidebarViewEnabled ? NewSidebarProvider : SidebarProvider;

  // Show skeleton loading state when data is not yet available
  if (isLoading && !initialLoadComplete) {
    return (
      <div className="courseware-loading">
        <SkeletonCourseContent />
      </div>
    );
  }

  return (
    <SidebarProviderComponent courseId={courseId} unitId={unitId}>
      <Helmet>
        <title>{`${pageTitleBreadCrumbs.join(' | ')} | ${getConfig().SITE_NAME}`}</title>
      </Helmet>
      <div className="position-relative d-flex align-items-xl-center mb-4 mt-1 flex-column flex-xl-row">
        {navigationDisabled || (
        <>
          <CourseBreadcrumbsSlot
            courseId={courseId}
            sectionId={section ? section.id : null}
            sequenceId={sequenceId}
            isStaff={isStaff}
            unitId={unitId}
          />
        </>
        )}
        {shouldDisplayChat && (
          <>
            <Chat
              enabled={course.learningAssistantEnabled}
              enrollmentMode={course.enrollmentMode}
              isStaff={isStaff}
              courseId={courseId}
              contentToolsEnabled={course.showCalculator || course.notes?.enabled}
              unitId={unitId}
            />
          </>
        )}
        <div className="w-100 d-flex align-items-center justify-content-end gap-2">
          <CourseOutlineMobileSidebarTriggerSlot />
          <NotificationsDiscussionsSidebarTriggerSlot courseId={courseId} />
        </div>
      </div>

      <AlertList topic="sequence" />
      <Sequence
        unitId={unitId}
        sequenceId={sequenceId}
        courseId={courseId}
        unitNavigationHandler={unitNavigationHandler}
        nextSequenceHandler={nextSequenceHandler}
        previousSequenceHandler={previousSequenceHandler}
      />
      <CelebrationModal
        courseId={courseId}
        isOpen={firstSectionCelebrationOpen}
        onClose={() => setFirstSectionCelebrationOpen(false)}
      />
      <WeeklyGoalCelebrationModal
        courseId={courseId}
        daysPerWeek={daysPerWeek}
        isOpen={weeklyGoalCelebrationOpen}
        onClose={() => setWeeklyGoalCelebrationOpen(false)}
      />
      <ContentTools course={course} />
    </SidebarProviderComponent>
  );
};

Course.propTypes = {
  courseId: PropTypes.string,
  sequenceId: PropTypes.string,
  unitId: PropTypes.string,
  nextSequenceHandler: PropTypes.func.isRequired,
  previousSequenceHandler: PropTypes.func.isRequired,
  unitNavigationHandler: PropTypes.func.isRequired,
  windowWidth: PropTypes.number.isRequired,
};

Course.defaultProps = {
  courseId: null,
  sequenceId: null,
  unitId: null,
};

const CourseWrapper = (props) => {
  // useWindowSize initially returns an undefined width intentionally at first.
  // See https://www.joshwcomeau.com/react/the-perils-of-rehydration/ for why.
  // But <Course> has some tricky window-size-dependent, session-storage-setting logic and React would yell at us if
  // we exited that component early, before hitting all the useState() calls.
  // So just skip all that until we have a window size available.
  const windowWidth = useWindowSize().width;
  if (windowWidth === undefined) {
    return null;
  }

  return <Course {...props} windowWidth={windowWidth} />;
};

export default CourseWrapper;
