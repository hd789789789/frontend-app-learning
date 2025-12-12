import { useContext } from 'react';
import PropTypes from 'prop-types';
import { Icon, IconButton } from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';
import { MessageOutline, WatchOutline } from '@openedx/paragon/icons';
import { useModel } from '@src/generic/model-store';

import { BookmarkButton } from '../bookmark';
import NewSidebarContext from '@src/courseware/course/new-sidebar/SidebarContext';
import OldSidebarContext from '@src/courseware/course/sidebar/SidebarContext';
import { SIDEBARS as NewSidebars } from '@src/courseware/course/new-sidebar/sidebars';
import { WIDGETS } from '@src/constants';

const UnitIconsColumn = ({ unitId, unit, isProcessing, courseId }) => {
  const intl = useIntl();
  const { isNewDiscussionSidebarViewEnabled } = useModel('courseHomeMeta', courseId);
  
  // Try to get sidebar context (either new or old)
  let sidebarContext = null;
  try {
    if (isNewDiscussionSidebarViewEnabled) {
      sidebarContext = useContext(NewSidebarContext);
    } else {
      sidebarContext = useContext(OldSidebarContext);
    }
  } catch (e) {
    // Context not available, will handle gracefully
  }
  
  // Check if SidebarContext is available
  const hasSidebarContext = sidebarContext && sidebarContext.toggleSidebar;
  
  const handleDiscussionClick = () => {
    if (hasSidebarContext) {
      if (isNewDiscussionSidebarViewEnabled && NewSidebars && WIDGETS) {
        sidebarContext.toggleSidebar(NewSidebars.DISCUSSIONS_NOTIFICATIONS.ID, WIDGETS.DISCUSSIONS);
      } else {
        // For old sidebar, use the sidebar ID directly
        const discussionsSidebarId = 'DISCUSSIONS';
        sidebarContext.toggleSidebar(discussionsSidebarId);
      }
    }
  };

  const handleNotificationClick = () => {
    if (hasSidebarContext) {
      if (isNewDiscussionSidebarViewEnabled && NewSidebars && WIDGETS) {
        sidebarContext.toggleSidebar(NewSidebars.DISCUSSIONS_NOTIFICATIONS.ID, WIDGETS.NOTIFICATIONS);
      } else {
        // For old sidebar, use the sidebar ID directly
        const notificationsSidebarId = 'NOTIFICATIONS';
        sidebarContext.toggleSidebar(notificationsSidebarId);
      }
    }
  };

  const showDiscussionIcon = hasSidebarContext && (sidebarContext.isDiscussionbarAvailable !== false);
  const showNotificationIcon = hasSidebarContext && (sidebarContext.isNotificationbarAvailable !== false);

  return (
    <div className="d-flex flex-column align-items-center position-absolute" style={{ top: 0, right: 0, gap: '8px', zIndex: 10 }}>
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
          {sidebarContext.notificationStatus === 'active' && (
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

UnitIconsColumn.propTypes = {
  unitId: PropTypes.string.isRequired,
  unit: PropTypes.shape({
    id: PropTypes.string.isRequired,
    bookmarked: PropTypes.bool.isRequired,
    bookmarkedUpdateState: PropTypes.string.isRequired,
  }).isRequired,
  isProcessing: PropTypes.bool.isRequired,
  courseId: PropTypes.string.isRequired,
};

export default UnitIconsColumn;

