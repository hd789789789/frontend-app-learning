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
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const fetchKey = `${tab || ''}::${courseIdFromUrl || ''}::${targetUserId || ''}::${isProgressTab}`;

    console.log('[TabContainer] useEffect triggered', {
      tab,
      courseIdFromUrl,
      targetUserId,
      isProgressTab,
      fetchKey,
      lastFetchKey: lastFetchKeyRef.current,
      isFetching: isFetchingRef.current,
      courseStatus,
      courseId,
    });

    // Skip if already fetched for this key
    if (lastFetchKeyRef.current === fetchKey) {
      console.log('[TabContainer] Skipping fetch - already fetched for this key');
      return;
    }

    // Skip if currently fetching (prevent double fetch in StrictMode)
    if (isFetchingRef.current) {
      console.log('[TabContainer] Skipping fetch - already fetching');
      return;
    }

    // If we've already loaded this course and status is loaded, skip refetch to avoid flicker/unmounts
    if (courseStatus === 'loaded' && courseId === courseIdFromUrl) {
      console.log('[TabContainer] Skipping fetch - course already loaded');
      lastFetchKeyRef.current = fetchKey;
      return;
    }

    // Set flags before dispatch to prevent double fetch
    console.log('[TabContainer] Dispatching fetch', { tab, courseIdFromUrl });
    lastFetchKeyRef.current = fetchKey;
    isFetchingRef.current = true;

    // Dispatch fetch
    if (isProgressTab) {
      dispatch(fetch(courseIdFromUrl, targetUserId));
    } else {
      dispatch(fetch(courseIdFromUrl));
    }

    // Reset fetching flag after a short delay
    // This prevents double fetch in StrictMode while allowing legitimate refetches
    const timeoutId = setTimeout(() => {
      isFetchingRef.current = false;
      console.log('[TabContainer] Reset isFetchingRef flag');
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseIdFromUrl, targetUserId, tab, isProgressTab]);

  // Avoid flashing loader for badge tab when course is already the active one
  const effectiveCourseStatus = (tab === 'badge' && courseStatus === 'loading' && resolvedCourseId === courseIdFromUrl)
    ? 'loaded'
    : courseStatus;

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
