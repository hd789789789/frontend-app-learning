/* eslint-disable import/prefer-default-export */
import React, { useMemo } from 'react';
import { useAlert } from '../../../../generic/user-messages';
import { useModel } from '../../../../generic/model-store';

import CourseEndAlert from './CourseEndAlert';

// period of time (in ms) before end of course during which we alert
const WARNING_PERIOD_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export function useCourseEndAlert(courseId) {
  const courseHomeMeta = useModel('courseHomeMeta', courseId) || {};
  const isEnrolled = courseHomeMeta.isEnrolled;
  const outlineData = useModel('outline', courseId) || {};
  const datesWidget = outlineData.datesWidget || {};
  const courseDateBlocks = datesWidget.courseDateBlocks || [];
  const userTimezone = datesWidget.userTimezone;

  const endBlock = courseDateBlocks.find(b => b.dateType === 'course-end-date');
  const endDate = endBlock ? new Date(endBlock.date) : null;
  const delta = endBlock ? endDate - new Date() : 0;
  const isVisible = isEnrolled && endBlock && delta > 0 && delta < WARNING_PERIOD_MS;
  const payload = useMemo(() => ({
    description: endBlock && endBlock.description,
    endDate: endBlock && endBlock.date,
    userTimezone,
  }), [endBlock, userTimezone]);

  useAlert(isVisible, {
    code: 'clientCourseEndAlert',
    payload,
    topic: 'outline-course-alerts',
  });

  return {
    clientCourseEndAlert: CourseEndAlert,
  };
}
