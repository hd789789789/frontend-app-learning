import PropTypes from 'prop-types';
import classNames from 'classnames';
import {
  Locked as LockedIcon,
  Article as ArticleIcon,
  LmsBook as LmsBookIcon,
  LmsEditSquare as LmsEditSquareIcon,
  LmsVideocam as LmsVideocamIcon,
} from '@openedx/paragon/icons';

export const UNIT_ICON_TYPES = {
  video: 'video',
  problem: 'problem',
  vertical: 'vertical',
  lock: 'lock',
  other: 'other',
};

// Badge icon component for completed units
const UnitBadgeIcon = ({ title }) => (
  <span
    className="d-inline-flex align-items-center justify-content-center"
    style={{
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
      color: '#fff',
      fontSize: '0.65rem',
      boxShadow: '0 2px 4px rgba(33, 150, 243, 0.3)',
    }}
    title={title || 'Hoàn thành'}
  >
    ✓
  </span>
);

UnitBadgeIcon.propTypes = {
  title: PropTypes.string,
};

UnitBadgeIcon.defaultProps = {
  title: 'Hoàn thành',
};

const UnitIcon = ({ type, isCompleted, ...props }) => {
  // Nếu unit đã hoàn thành, hiển thị badge icon
  if (isCompleted && type !== UNIT_ICON_TYPES.lock) {
    return <UnitBadgeIcon title="Unit hoàn thành" />;
  }

  const iconMap = {
    [UNIT_ICON_TYPES.video]: LmsVideocamIcon,
    [UNIT_ICON_TYPES.problem]: LmsEditSquareIcon,
    [UNIT_ICON_TYPES.vertical]: ArticleIcon,
    [UNIT_ICON_TYPES.lock]: LockedIcon,
    [UNIT_ICON_TYPES.other]: LmsBookIcon,
  };

  const Icon = iconMap[type || UNIT_ICON_TYPES.other];

  return (
    <Icon {...props} className={classNames('text-gray-400')} />
  );
};

UnitIcon.propTypes = {
  type: PropTypes.oneOf(Object.keys(UNIT_ICON_TYPES)).isRequired,
  isCompleted: PropTypes.bool.isRequired,
};

export default UnitIcon;
