import React from 'react';

interface Props {
  type: 'chapter' | 'section' | 'unit';
  isCompleted: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const BadgeIcon: React.FC<Props> = ({ type, isCompleted, size = 'sm' }) => {
  const sizeMap = {
    sm: { width: 18, height: 18, fontSize: '0.65rem' },
    md: { width: 24, height: 24, fontSize: '0.8rem' },
    lg: { width: 32, height: 32, fontSize: '1rem' },
  };

  const { width, height, fontSize } = sizeMap[size];

  const badgeConfig = {
    chapter: {
      icon: '🏆',
      completedBg: 'linear-gradient(135deg, #ffd700 0%, #ffb300 100%)',
      label: 'Chuong',
    },
    section: {
      icon: '📚',
      completedBg: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
      label: 'Bai',
    },
    unit: {
      icon: '✓',
      completedBg: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
      label: 'Unit',
    },
  };

  const config = badgeConfig[type] || badgeConfig.unit;

  if (!isCompleted) {
    return null;
  }

  return (
    <span
      className="d-inline-flex align-items-center justify-content-center ml-2"
      style={{
        width,
        height,
        borderRadius: '50%',
        background: config.completedBg,
        color: '#fff',
        fontWeight: 'bold',
        fontSize,
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        transition: 'all 0.3s ease',
        flexShrink: 0,
      }}
      title={`${config.label} da hoan thanh`}
    >
      {config.icon}
    </span>
  );
};

export default BadgeIcon;

