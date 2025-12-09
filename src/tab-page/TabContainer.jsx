import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { OuterExamTimer } from '@edx/frontend-lib-special-exams';

import TabPage from './TabPage';

const TabContainer = (props) => {
  const {
    children,
    fetch,
    slice,
    tab,
    isProgressTab,
  } = props;

  const { courseId: courseIdFromUrl, targetUserId } = useParams();
  const dispatch = useDispatch();

  // The courseId from the store is the course we HAVE loaded.  If the URL changes,
  // we don't want the application to adjust to it until it has actually loaded the new data.
  const {
    courseId,
    courseStatus,
  } = useSelector(state => state[slice]);

  // Always prefer the course id from the URL so we render tab navigation
  // even before the redux slice finishes updating (e.g., right after reload).
  // This avoids passing a null courseId to TabPage/LoadedTabPage which would
  // leave the tabs array empty and hide navigation.
  const resolvedCourseId = courseIdFromUrl || courseId;

  const lastFetchKeyRef = useRef(null);

  useEffect(() => {
    const fetchKey = `${tab || ''}::${courseIdFromUrl || ''}::${targetUserId || ''}::${isProgressTab}`;
    // Debug: trace effect inputs and decisions
    console.log('[TabContainer] useEffect', {
      tab,
      courseIdFromUrl,
      targetUserId,
      isProgressTab,
      courseId,
      courseStatus,
      fetchKey,
      lastFetchKey: lastFetchKeyRef.current,
    });

    if (lastFetchKeyRef.current === fetchKey) {
      console.log('[TabContainer] Skip dispatch - same fetchKey');
      return;
    }

    // If we've already loaded this course and status is loaded, skip refetch to avoid flicker/unmounts
    if (courseStatus === 'loaded' && courseId === courseIdFromUrl) {
      console.log('[TabContainer] Skip dispatch - already loaded same course');
      lastFetchKeyRef.current = fetchKey;
      return;
    }

    lastFetchKeyRef.current = fetchKey;
    if (isProgressTab) {
      console.log('[TabContainer] Dispatching fetch progress tab', { courseIdFromUrl, targetUserId });
      dispatch(fetch(courseIdFromUrl, targetUserId));
    } else {
      console.log('[TabContainer] Dispatching fetch tab', { tab, courseIdFromUrl });
      dispatch(fetch(courseIdFromUrl));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseIdFromUrl, targetUserId, tab, isProgressTab]);

  // Avoid flashing loader for badge tab when course is already the active one
  const effectiveCourseStatus = (tab === 'badge' && courseStatus === 'loading' && resolvedCourseId === courseIdFromUrl)
    ? 'loaded'
    : courseStatus;
  if (courseStatus !== effectiveCourseStatus) {
    console.log('[TabContainer] Override courseStatus for badge tab', { courseStatus, effectiveCourseStatus, tab, courseId, courseIdFromUrl, resolvedCourseId });
  }

  return (
    <TabPage
      activeTabSlug={tab}
      courseId={resolvedCourseId}
      courseStatus={effectiveCourseStatus}
      metadataModel={`${slice}Meta`}
    >
      {resolvedCourseId && <OuterExamTimer courseId={resolvedCourseId} />}
      {children}
    </TabPage>
  );
};

TabContainer.propTypes = {
  children: PropTypes.node.isRequired,
  fetch: PropTypes.func.isRequired,
  slice: PropTypes.string.isRequired,
  tab: PropTypes.string.isRequired,
  isProgressTab: PropTypes.bool,
};

TabContainer.defaultProps = {
  isProgressTab: false,
};

export default TabContainer;
