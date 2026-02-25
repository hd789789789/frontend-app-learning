import React, { useMemo } from 'react';

import { useAlert } from '../../../../generic/user-messages';
import { useModel } from '../../../../generic/model-store';

import ScheduledContentAlert from './ScheduledCotentAlert';

const useScheduledContentAlert = (courseId) => {
  const outlineData = useModel('outline', courseId) || {};
  const courseBlocks = outlineData.courseBlocks || {};
  const courses = courseBlocks.courses || {};
  const datesWidget = outlineData.datesWidget || {};
  const datesTabLink = datesWidget.datesTabLink;

  const hasScheduledContent = (
    !!courses
    && !!Object.values(courses).find(course => course.hasScheduledContent === true)
  );
  const courseHomeMeta = useModel('courseHomeMeta', courseId) || {};
  const isEnrolled = courseHomeMeta.isEnrolled;
  const payload = useMemo(() => ({
    datesTabLink,
  }), [datesTabLink]);
  useAlert(hasScheduledContent && isEnrolled, {
    code: 'ScheduledContentAlert',
    payload,
    topic: 'outline-course-alerts',
  });

  return { ScheduledContentAlert };
};

export default useScheduledContentAlert;
