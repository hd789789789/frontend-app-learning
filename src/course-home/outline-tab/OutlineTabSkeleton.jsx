import React from 'react';
import './OutlineTab.scss';

// Standalone skeleton component for OutlineTab loading state.
// Used as a children replacement inside LoadedTabPage while courseStatus === 'loading'
// to prevent OutlineTab hooks from running before Redux data is ready (Error #311).
// NOTE: Do NOT wrap in <main> - LoadedTabPage already provides the <main> wrapper.
const OutlineTabSkeleton = () => (
  <div className="outline-tab-loading">
    {/* Title skeleton */}
    <div className="skeleton" style={{ width: '40%', height: '32px', marginBottom: '24px' }} />

    <div className="row course-outline-tab">
      <div className="col col-12 col-md-8">
        {/* Start or Resume Card skeleton */}
        <div className="skeleton mb-3" style={{ width: '100%', height: '120px', borderRadius: '8px' }} />

        {/* Welcome Message skeleton */}
        <div className="skeleton mb-3" style={{ width: '100%', height: '60px', borderRadius: '8px' }} />

        {/* Section list skeleton */}
        <div className="skeleton-outline-section">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton mb-2" style={{ width: '100%', height: '80px', borderRadius: '8px' }} />
          ))}
        </div>
      </div>

      {/* Sidebar skeleton */}
      <div className="col col-12 col-md-4">
        <div className="skeleton-sidebar">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton mb-2" style={{ width: '100%', height: '100px', borderRadius: '8px' }} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default OutlineTabSkeleton;
