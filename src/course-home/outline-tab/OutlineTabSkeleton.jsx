import React from 'react';
import './OutlineTab.scss';

// Standalone skeleton component for OutlineTab loading state.
// Used as a children replacement inside LoadedTabPage while courseStatus === 'loading'
// to prevent OutlineTab hooks from running before Redux data is ready (Error #311).
// NOTE: Do NOT wrap in <main> - LoadedTabPage already provides the <main> wrapper.
//
// Layout mirrors the real OutlineTab structure so there is no visual "jump"
// when the actual content replaces the skeleton.
const OutlineTabSkeleton = () => (
  <div className="outline-tab-loading">
    {/* Course title */}
    <div className="skeleton mb-4" style={{ width: '55%', height: '28px' }} />

    <div className="row course-outline-tab">
      {/* Main column */}
      <div className="col col-12 col-md-8">
        {/* Start / Resume card */}
        <div className="skeleton mb-4" style={{ width: '100%', height: '96px', borderRadius: '8px' }} />

        {/* Welcome message banner */}
        <div className="skeleton mb-4" style={{ width: '100%', height: '52px', borderRadius: '8px' }} />

        {/* Section accordion rows — 5 rows to fill the viewport */}
        <div className="skeleton-outline-section">
          {[88, 72, 88, 72, 80].map((h, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i} className="skeleton mb-2" style={{ width: '100%', height: `${h}px`, borderRadius: '8px' }} />
          ))}
        </div>
      </div>

      {/* Sidebar column */}
      <div className="col col-12 col-md-4">
        <div className="skeleton-sidebar">
          {/* Dates widget */}
          <div className="skeleton mb-3" style={{ width: '100%', height: '140px', borderRadius: '8px' }} />
          {/* Course tools widget */}
          <div className="skeleton mb-3" style={{ width: '100%', height: '110px', borderRadius: '8px' }} />
          {/* Handouts widget */}
          <div className="skeleton mb-3" style={{ width: '100%', height: '90px', borderRadius: '8px' }} />
        </div>
      </div>
    </div>
  </div>
);

export default OutlineTabSkeleton;
