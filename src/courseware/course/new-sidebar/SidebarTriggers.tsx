import React, { useContext } from 'react';

import SidebarContext from './SidebarContext';
import { SIDEBAR_ORDER, SIDEBARS } from './sidebars';
import { BookmarkButton } from '../bookmark';
import { useModel } from '@src/generic/model-store';

const SidebarTriggers = () => {
  const { toggleSidebar, unitId } = useContext(SidebarContext);
  const unit = useModel('units', unitId);
  const isProcessing = unit?.bookmarkedUpdateState === 'loading';

  return (
    <div className="d-flex ml-auto align-items-center">
      {unit ? (
        <BookmarkButton
          unitId={unitId}
          isBookmarked={unit.bookmarked}
          isProcessing={isProcessing}
          className="ml-1"
        />
      ) : null}
      {SIDEBAR_ORDER.map((sidebarId) => {
        const { Trigger } = SIDEBARS[sidebarId];
        return (
          <Trigger onClick={() => toggleSidebar(sidebarId)} key={sidebarId} />
        );
      })}
    </div>
  );
};

export default SidebarTriggers;
