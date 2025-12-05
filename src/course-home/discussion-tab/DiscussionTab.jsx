import { getConfig } from '@edx/frontend-platform';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams, generatePath, useNavigate } from 'react-router-dom';
import { useIFrameHeight, useIFramePluginEvents } from '../../generic/hooks';

const DiscussionTab = () => {
  const { courseId } = useSelector(state => state.courseHome);
  const { path } = useParams();
  const [originalPath] = useState(path || 'posts');
  const navigate = useNavigate();

  const [, iFrameHeight] = useIFrameHeight();
  useIFramePluginEvents({
    'discussions.navigate': (payload) => {
      const basePath = generatePath('/course/:courseId/discussion', { courseId });
      navigate(`${basePath}/${payload.path}`);
    },
  });
  
  // Xây dựng URL: nếu có path thì thêm vào, không thì chỉ dùng courseId
  // Format: {DISCUSSIONS_MFE_BASE_URL}/{courseId}/{path} hoặc {DISCUSSIONS_MFE_BASE_URL}/{courseId}
  const discussionsBaseUrl = getConfig().DISCUSSIONS_MFE_BASE_URL;
  const discussionsUrl = originalPath 
    ? `${discussionsBaseUrl}/${courseId}/${originalPath}`
    : `${discussionsBaseUrl}/${courseId}/posts`;
  
  return (
    <iframe
      src={discussionsUrl}
      className="d-flex w-100 border-0"
      height={iFrameHeight}
      style={{ minHeight: '60rem' }}
      title="discussion"
    />
  );
};

export default DiscussionTab;
