import { getConfig } from '@edx/frontend-platform';
import React from 'react';
import { useSelector } from 'react-redux';
import { useIFrameHeight } from '../../generic/hooks';

const TeamsTab = () => {
  const { courseId } = useSelector(state => state.courseHome);
  const [, iFrameHeight] = useIFrameHeight();
  
  // Teams sử dụng legacy view, load trực tiếp từ LMS
  const teamsUrl = `${getConfig().LMS_BASE_URL}/courses/${courseId}/teams_dashboard`;
  
  return (
    <iframe
      src={teamsUrl}
      className="d-flex w-100 border-0"
      height={iFrameHeight}
      style={{ minHeight: '60rem' }}
      title="teams"
    />
  );
};

export default TeamsTab;

