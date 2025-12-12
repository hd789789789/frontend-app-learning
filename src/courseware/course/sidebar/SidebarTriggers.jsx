import { useContext } from 'react';
import classNames from 'classnames';
import { breakpoints, useWindowSize } from '@openedx/paragon';
import SidebarContext from './SidebarContext';
import { SIDEBAR_ORDER, SIDEBARS } from './sidebars';
import { BookmarkButton } from '../bookmark';
import { useModel } from '@src/generic/model-store';

const SidebarTriggers = () => {
  const {
    toggleSidebar,
    currentSidebar,
    unitId,
  } = useContext(SidebarContext);
  const unit = useModel('units', unitId);
  const isProcessing = unit?.bookmarkedUpdateState === 'loading';

  const isMobileView = useWindowSize().width < breakpoints.small.minWidth;

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
        const isActive = sidebarId === currentSidebar;
        return (
          <div
            className={classNames({ 'ml-1': !isMobileView, 'border-primary-700 sidebar-active': isActive })}
            style={{ borderBottom: '2px solid', borderColor: isActive ? 'inherit' : 'transparent' }}
            key={sidebarId}
          >
            <Trigger onClick={() => toggleSidebar(sidebarId)} key={sidebarId} />
          </div>
        );
      })}
    </div>
  );
};

SidebarTriggers.propTypes = {};

export default SidebarTriggers;
