import { getConfig } from '@edx/frontend-platform';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

const DiscussionTab = () => {
  const { courseId } = useSelector(state => state.courseHome);
  const { path } = useParams();
  
  // Redirect đến discussions MFE thay vì dùng iframe
  useEffect(() => {
    const discussionsBaseUrl = getConfig().DISCUSSIONS_MFE_BASE_URL;
    const discussionPath = path || 'posts';
    const discussionsUrl = `${discussionsBaseUrl}/${courseId}/${discussionPath}`;
    
    // Redirect đến discussions MFE
    window.location.href = discussionsUrl;
  }, [courseId, path]);
  
  // Hiển thị loading trong khi redirect
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60rem' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="sr-only">Đang chuyển hướng đến trang thảo luận...</span>
      </div>
    </div>
  );
};

export default DiscussionTab;
