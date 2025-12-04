import PropTypes from 'prop-types';
import {
  LmsCompletionSolid as LmsCompletionSolidIcon,
} from '@openedx/paragon/icons';

import { DashedCircleIcon } from '../icons';

// Badge icon component for completed sections (Bài)
const BadgeCompletedIcon = () => (
  <span
    className="d-inline-flex align-items-center justify-content-center"
    style={{
      width: 24,
      height: 24,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
      color: '#fff',
      fontSize: '0.85rem',
      boxShadow: '0 2px 6px rgba(76, 175, 80, 0.35)',
    }}
    data-testid="badge-completed-icon"
    title="Hoàn thành"
  >
    🏅
  </span>
);

const CompletionIcon = ({ completionStat: { completed = 0, total = 0 } }) => {
  const percentage = total !== 0 ? Math.min((completed / total) * 100, 100) : 0;
  const remainder = 100 - percentage;

  switch (true) {
    case !completed:
      return <LmsCompletionSolidIcon className="text-gray-300" data-testid="completion-solid-icon" />;
    case completed === total:
      // Hiển thị badge khi hoàn thành tất cả unit trong section
      return <BadgeCompletedIcon />;
    default:
      return <DashedCircleIcon percentage={percentage} remainder={remainder} data-testid="dashed-circle-icon" />;
  }
};

CompletionIcon.propTypes = {
  completionStat: PropTypes.shape({
    completed: PropTypes.number,
    total: PropTypes.number,
  }).isRequired,
};

export default CompletionIcon;
