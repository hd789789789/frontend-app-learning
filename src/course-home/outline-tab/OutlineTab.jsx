import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { sendTrackEvent } from '@edx/frontend-platform/analytics';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Button } from '@openedx/paragon';
import { CourseOutlineTabNotificationsSlot } from '../../plugin-slots/CourseOutlineTabNotificationsSlot';
import { AlertList } from '../../generic/user-messages';

import CourseDates from './widgets/CourseDates';
import CourseHandouts from './widgets/CourseHandouts';
import StartOrResumeCourseCard from './widgets/StartOrResumeCourseCard';
import WeeklyLearningGoalCard from './widgets/WeeklyLearningGoalCard';
import CourseTools from './widgets/CourseTools';
import { fetchOutlineTab } from '../data';
import messages from './messages';
import ShiftDatesAlert from '../suggested-schedule-messaging/ShiftDatesAlert';
import UpgradeToShiftDatesAlert from '../suggested-schedule-messaging/UpgradeToShiftDatesAlert';
import useCertificateAvailableAlert from './alerts/certificate-status-alert';
import useCourseEndAlert from './alerts/course-end-alert';
import useCourseStartAlert from '../../alerts/course-start-alert';
import usePrivateCourseAlert from './alerts/private-course-alert';
import useScheduledContentAlert from './alerts/scheduled-content-alert';
import { useModel } from '../../generic/model-store';
import WelcomeMessage from './widgets/WelcomeMessage';
import ProctoringInfoPanel from './widgets/ProctoringInfoPanel';
import AccountActivationAlert from '../../alerts/logistration-alert/AccountActivationAlert';
import CourseHomeSectionOutlineSlot from '../../plugin-slots/CourseHomeSectionOutlineSlot';
import './OutlineTab.scss';

// Skeleton loading components
const SkeletonOutlineSection = () => (
  <div className="skeleton-outline-section mb-3">
    <div className="skeleton" style={{ height: '48px', borderRadius: '8px', marginBottom: '12px' }} />
    <div className="skeleton-sequence-list">
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton d-flex align-items-center p-3 mb-2" style={{ borderRadius: '8px', background: '#f8f9fa' }}>
          <div className="skeleton me-3" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton mb-2" style={{ width: '70%', height: '16px' }} />
            <div className="skeleton" style={{ width: '40%', height: '12px' }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SkeletonOutlineSidebar = () => (
  <div className="skeleton-sidebar">
    <div className="skeleton mb-3" style={{ height: '120px', borderRadius: '8px' }} />
    <div className="skeleton mb-3" style={{ height: '80px', borderRadius: '8px' }} />
    <div className="skeleton mb-3" style={{ height: '100px', borderRadius: '8px' }} />
  </div>
);

const OutlineTab = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const {
    courseId,
    courseStatus,
    proctoringPanelStatus,
  } = useSelector(state => state.courseHome);

  const {
    isSelfPaced,
    org,
    title,
  } = useModel('courseHomeMeta', courseId);

  const expandButtonRef = useRef();

  const {
    courseBlocks: {
      courses,
      sections,
    } = {},
    courseGoals: {
      selectedGoal,
      weeklyLearningGoalEnabled,
    } = {},
    datesWidget: {
      courseDateBlocks,
    },
    enableProctoredExams,
  } = useModel('outline', courseId) || {};

  const [expandAll, setExpandAll] = useState(false);
  const navigate = useNavigate();

  // Track initial load state - show skeleton until data is available
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Check if outline data is available
  const hasOutlineData = Boolean(courses && Object.keys(courses).length > 0);
  const loading = courseStatus === 'loading' || !hasOutlineData;

  // Mark initial load complete after first render
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoadComplete(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Lazy fetch outline data if not available (handles case where TabContainer hasn't fetched it yet)
  const outlineFetchingRef = useRef(false);

  useEffect(() => {
    if (!courseId || hasOutlineData || outlineFetchingRef.current) {
      return;
    }

    outlineFetchingRef.current = true;
    dispatch(fetchOutlineTab(courseId)).finally(() => {
      outlineFetchingRef.current = false;
    });
  }, [courseId, hasOutlineData, dispatch]);

  const eventProperties = {
    org_key: org,
    courserun_key: courseId,
  };

  // Below the course title alerts (appearing in the order listed here)
  const courseStartAlert = useCourseStartAlert(courseId);
  const courseEndAlert = useCourseEndAlert(courseId);
  const certificateAvailableAlert = useCertificateAvailableAlert(courseId);
  const privateCourseAlert = usePrivateCourseAlert(courseId);
  const scheduledContentAlert = useScheduledContentAlert(courseId);

  const rootCourseId = courses && Object.keys(courses)[0];

  const hasDeadlines = courseDateBlocks && courseDateBlocks.some(x => x.dateType === 'assignment-due-date');

  const logUpgradeToShiftDatesLinkClick = () => {
    sendTrackEvent('edx.bi.ecommerce.upsell_links_clicked', {
      ...eventProperties,
      linkCategory: 'personalized_learner_schedules',
      linkName: 'course_home_upgrade_shift_dates',
      linkType: 'button',
      pageName: 'course_home',
    });
  };

  const isEnterpriseUser = () => {
    const authenticatedUser = getAuthenticatedUser();
    const userRoleNames = authenticatedUser ? authenticatedUser.roles.map(role => role.split(':')[0]) : [];

    return userRoleNames.includes('enterprise_learner');
  };

  /** show post enrolment survey to only B2C learners */
  const learnerType = isEnterpriseUser() ? 'enterprise_learner' : 'b2c_learner';

  const location = useLocation();

  useEffect(() => {
    const currentParams = new URLSearchParams(location.search);
    const startCourse = currentParams.get('start_course');
    if (startCourse === '1') {
      sendTrackEvent('enrollment.email.clicked.startcourse', {});

      // Deleting the course_start query param as it only needs to be set once
      // whenever passed in query params.
      currentParams.delete('start_course');
      navigate({
        pathname: location.pathname,
        search: `?${currentParams.toString()}`,
        replace: true,
      });
    }
  }, [location.search]);

  // Show initial loading state with skeleton
  if (loading && !initialLoadComplete) {
    return (
      <div className="outline-tab-loading">
        <div className="row w-100 mx-0 my-3">
          <div className="col-12">
            <div className="skeleton" style={{ height: '32px', width: '40%', marginBottom: '8px' }} />
          </div>
        </div>
        <div className="row course-outline-tab">
          <div className="col col-12 col-md-8">
            <div className="skeleton" style={{ height: '100px', borderRadius: '8px', marginBottom: '16px' }} />
            <SkeletonOutlineSection />
            <SkeletonOutlineSection />
          </div>
          <div className="col col-12 col-md-4">
            <SkeletonOutlineSidebar />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div data-learner-type={learnerType} className="row w-100 mx-0 my-3 justify-content-between">
        <div className="col-12 col-sm-auto p-0">
          <div role="heading" aria-level="1" className="h2">{title}</div>
        </div>
      </div>
      <div className="row course-outline-tab">
        <AccountActivationAlert />
        <div className="col-12">
          <AlertList
            topic="outline-private-alerts"
            customAlerts={{
              ...privateCourseAlert,
            }}
          />
        </div>
        <div className="col col-12 col-md-8">
          <AlertList
            topic="outline-course-alerts"
            className="mb-3"
            customAlerts={{
              ...certificateAvailableAlert,
              ...courseEndAlert,
              ...courseStartAlert,
              ...scheduledContentAlert,
            }}
          />
          {isSelfPaced && hasDeadlines && (
            <>
              <ShiftDatesAlert model="outline" fetch={fetchOutlineTab} />
              <UpgradeToShiftDatesAlert model="outline" logUpgradeLinkClick={logUpgradeToShiftDatesLinkClick} />
            </>
          )}
          <StartOrResumeCourseCard />
          <WelcomeMessage courseId={courseId} nextElementRef={expandButtonRef} />
          {rootCourseId && (
            <>
              <div id="expand-button-row" className="row w-100 m-0 mb-3 justify-content-end">
                <div className="col-12 col-md-auto p-0">
                  <Button ref={expandButtonRef} variant="outline-primary" block onClick={() => { setExpandAll(!expandAll); }}>
                    {expandAll ? intl.formatMessage(messages.collapseAll) : intl.formatMessage(messages.expandAll)}
                  </Button>
                </div>
              </div>
              <CourseHomeSectionOutlineSlot
                expandAll={expandAll}
                sectionIds={courses[rootCourseId].sectionIds}
                sections={sections}
              />
            </>
          )}
        </div>
        {rootCourseId && (
          <div className="col col-12 col-md-4">
            <ProctoringInfoPanel />
            { /** Defer showing the goal widget until the ProctoringInfoPanel has resolved or has been determined as
             disabled to avoid components bouncing around too much as screen is rendered */ }
            {(!enableProctoredExams || proctoringPanelStatus === 'loaded') && weeklyLearningGoalEnabled && (
              <WeeklyLearningGoalCard
                daysPerWeek={selectedGoal && 'daysPerWeek' in selectedGoal ? selectedGoal.daysPerWeek : null}
                subscribedToReminders={selectedGoal && 'subscribedToReminders' in selectedGoal ? selectedGoal.subscribedToReminders : false}
              />
            )}
            <CourseTools />
            <CourseOutlineTabNotificationsSlot courseId={courseId} />
            <CourseDates />
            <CourseHandouts />
          </div>
        )}
      </div>
    </>
  );
};

export default OutlineTab;
