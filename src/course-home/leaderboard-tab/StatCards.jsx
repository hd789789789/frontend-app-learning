import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '@openedx/paragon';
import { formatInteger } from './numberUtils';

// CSS styles for hover animation
const cardHoverStyle = `
  .stat-card-hover {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    cursor: pointer;
  }
  .stat-card-hover:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
  }
`;

const StatCards = ({
  totalStudents, avgGrade, maxGrade, maxCoins, competingCount, currentStreak, bestStreak,
}) => {
  const stats = [
    {
      value: totalStudents,
      label: 'TỔNG HỌC VIÊN',
      color: '#4285f4',
    },
    {
      // Show highest coins (Xu) instead of average XP per request
      value: `${formatInteger(maxCoins != null ? maxCoins : 0)} Xu`,
      label: 'Xu cao nhất',
      color: '#34a853',
    },
    {
      value: `${formatInteger(maxGrade != null ? maxGrade : 0)} XP`,
      label: 'ĐIỂM XP CAO NHẤT',
      color: '#9c27b0',
    },
    {
      value: competingCount || 0,
      label: 'ĐANG THI ĐUA',
      color: '#34a853',
    },
    {
      value: `${currentStreak || 0} ngày`,
      label: 'CHUỖI LIÊN TIẾP',
      color: '#ff9800',
    },
    {
      value: `${bestStreak || 0} ngày`,
      label: 'CHUỖI DÀI NHẤT',
      color: '#f57c00',
    },
  ];

  return (
    <>
      <style>{cardHoverStyle}</style>
      <div className="row mb-4">
        {stats.map((stat, index) => (
          <div key={index} className="col-lg-4 col-md-4 col-sm-6 mb-3">
            <Card
              className="h-100 text-center shadow-sm stat-card-hover"
              style={{ borderRadius: '12px' }}
            >
              <Card.Body className="py-4">
                <div
                  className="display-4 font-weight-bold mb-2"
                  style={{ color: stat.color, fontSize: '2.5rem' }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-muted text-uppercase"
                  style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}
                >
                  {stat.label}
                </div>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>
    </>
  );
};

StatCards.propTypes = {
  totalStudents: PropTypes.number,
  avgGrade: PropTypes.number,
  maxGrade: PropTypes.number,
  maxCoins: PropTypes.number,
  competingCount: PropTypes.number,
  currentStreak: PropTypes.number,
  bestStreak: PropTypes.number,
};

StatCards.defaultProps = {
  totalStudents: 0,
  avgGrade: 0,
  maxGrade: 0,
  maxCoins: 0,
  competingCount: 0,
  currentStreak: 0,
  bestStreak: 0,
};

export default StatCards;
