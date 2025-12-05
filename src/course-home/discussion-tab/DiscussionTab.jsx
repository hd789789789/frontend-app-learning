import { getConfig } from '@edx/frontend-platform';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, generatePath, useNavigate } from 'react-router-dom';
import { useIFrameHeight, useIFramePluginEvents } from '../../generic/hooks';

const DiscussionTab = () => {
  const { courseId } = useSelector(state => state.courseHome);
  const { path } = useParams();
  const [originalPath] = useState(path || 'posts');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const [, iFrameHeight] = useIFrameHeight();
  
  // Handle navigation events from discussions iframe
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
  
  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // Update URL when path changes
  useEffect(() => {
    setIsLoading(true);
  }, [path, courseId]);
  
  return (
    <div className="d-flex flex-column w-100 position-relative" style={{ minHeight: '60rem' }}>
      {isLoading && (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '10rem' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Đang tải...</span>
          </div>
        </div>
      )}
      <iframe
        src={discussionsUrl}
        className="d-flex w-100 border-0"
        height={iFrameHeight}
        style={{ 
          minHeight: '60rem',
          display: isLoading ? 'none' : 'flex',
          border: 'none',
        }}
        title="discussion"
        onLoad={handleIframeLoad}
        allow="clipboard-write"
      />
    </div>
  );
};

export default DiscussionTab;
