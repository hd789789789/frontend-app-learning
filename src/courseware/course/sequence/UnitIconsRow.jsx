import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Icon, IconButton } from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';
import { MessageOutline, WatchOutline } from '@openedx/paragon/icons';
import { useModel } from '@src/generic/model-store';

import { BookmarkButton } from '../bookmark';
import NewSidebarContext from '../../new-sidebar/SidebarContext';
import OldSidebarContext from '../../sidebar/SidebarContext';
import { SIDEBARS as NewSidebars } from '../../new-sidebar/sidebars';
import { WIDGETS } from '@src/constants';

const UnitIconsRow = ({ unitId, unit, isProcessing, courseId }) => {
  const intl = useIntl();
  const { isNewDiscussionSidebarViewEnabled } = useModel('courseHomeMeta', courseId);

  let sidebarContext = null;
  try {
    sidebarContext = useContext(isNewDiscussionSidebarViewEnabled ? NewSidebarContext : OldSidebarContext);
  } catch (e) {
    // Context not available in this render path; fall back to only bookmark.
  }

  const hasSidebarContext = sidebarContext && sidebarContext.toggleSidebar;

  const handleDiscussionClick = () => {
    if (!hasSidebarContext) return;
    if (isNewDiscussionSidebarViewEnabled) {
      sidebarContext.toggleSidebar(NewSidebars.DISCUSSIONS_NOTIFICATIONS.ID, WIDGETS.DISCUSSIONS);
    } else {
      sidebarContext.toggleSidebar('DISCUSSIONS');
    }
  };

  const handleNotificationClick = () => {
    if (!hasSidebarContext) return;
    if (isNewDiscussionSidebarViewEnabled) {
      sidebarContext.toggleSidebar(NewSidebars.DISCUSSIONS_NOTIFICATIONS.ID, WIDGETS.NOTIFICATIONS);
    } else {
      sidebarContext.toggleSidebar('NOTIFICATIONS');
    }
  };

  const showDiscussionIcon = hasSidebarContext && (sidebarContext.isDiscussionbarAvailable !== false);
  const showNotificationIcon = hasSidebarContext && (sidebarContext.isNotificationbarAvailable !== false);

  return (
    <div
      className="d-flex align-items-center position-absolute"
      style={{ top: 0, right: 0, gap: '8px', zIndex: 10 }}
    >
      <BookmarkButton
        unitId={unitId}
        isBookmarked={unit.bookmarked}
        isProcessing={isProcessing}
      />
      {showDiscussionIcon && (
        <IconButton
          variant="link"
          className="px-1 text-primary-500"
          onClick={handleDiscussionClick}
          src={MessageOutline}
          iconAs={Icon}
          alt={intl.formatMessage({ id: 'discussions.sidebar.open.button', defaultMessage: 'Open discussions' })}
          aria-label={intl.formatMessage({ id: 'discussions.sidebar.open.button', defaultMessage: 'Open discussions' })}
        />
      )}
      {showNotificationIcon && (
        <IconButton
          variant="link"
          className="px-1 text-primary-500 position-relative"
          onClick={handleNotificationClick}
          src={WatchOutline}
          iconAs={Icon}
          alt={intl.formatMessage({ id: 'notification.open.button', defaultMessage: 'Open notifications' })}
          aria-label={intl.formatMessage({ id: 'notification.open.button', defaultMessage: 'Open notifications' })}
        >
          {sidebarContext?.notificationStatus === 'active' && (
            <span
              className="rounded-circle bg-danger position-absolute"
              style={{
                top: '0.3rem',
                right: '0.55rem',
                width: '8px',
                height: '8px',
              }}
              data-testid="notification-dot"
            />
          )}
        </IconButton>
      )}
    </div>
  );
};

UnitIconsRow.propTypes = {
  unitId: PropTypes.string.isRequired,
  unit: PropTypes.shape({
    id: PropTypes.string.isRequired,
    bookmarked: PropTypes.bool.isRequired,
    bookmarkedUpdateState: PropTypes.string.isRequired,
  }).isRequired,
  isProcessing: PropTypes.bool.isRequired,
  courseId: PropTypes.string.isRequired,
};

export default UnitIconsRow;

