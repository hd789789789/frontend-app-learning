import React, { useMemo } from 'react';
import { useAlert } from '../../generic/user-messages';
import { useModel } from '../../generic/model-store';

import CourseStartAlert from './CourseStartAlert';
import CourseStartMasqueradeBanner from './CourseStartMasqueradeBanner';

function IsStartDateInFuture(courseId) {
  const courseHomeMeta = useModel('courseHomeMeta', courseId) || {};
  const start = courseHomeMeta.start;

  if (!start) return false;
  
  const today = new Date();
  const startDate = new Date(start);
  return startDate > today;
}

function useCourseStartAlert(courseId) {
  const courseHomeMeta = useModel('courseHomeMeta', courseId) || {};
  const {
    isEnrolled,
  } = courseHomeMeta;

  const isVisible = isEnrolled && IsStartDateInFuture(courseId);

  const payload = useMemo(() => ({
    courseId,
  }), [courseId]);

  useAlert(isVisible, {
    code: 'clientCourseStartAlert',
    payload,
    topic: 'outline-course-alerts',
  });

  return {
    clientCourseStartAlert: CourseStartAlert,
  };
}

export function useCourseStartMasqueradeBanner(courseId, tab) {
  const courseHomeMeta = useModel('courseHomeMeta', courseId) || {};
  const {
    isMasquerading,
  } = courseHomeMeta;

  const isVisible = isMasquerading && tab === 'progress' && IsStartDateInFuture(courseId);

  const payload = useMemo(() => ({
    courseId,
  }), [courseId]);

  useAlert(isVisible, {
    code: 'clientCourseStartMasqueradeBanner',
    payload,
    topic: 'instructor-toolbar-alerts',
  });

  return {
    clientCourseStartMasqueradeBanner: CourseStartMasqueradeBanner,
  };
}

export default useCourseStartAlert;
