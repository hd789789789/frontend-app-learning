import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '@openedx/paragon';

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

function StatCards({ totalStudents, avgGrade, maxGrade, competingCount, currentStreak, bestStreak }) {
  const stats = [
    {
      value: totalStudents,
      label: 'TỔNG HỌC VIÊN',
      color: '#4285f4',
    },
    {
      value: `${avgGrade?.toFixed(1) || 0}/10`,
      label: 'ĐIỂM TRUNG BÌNH',
      color: '#34a853',
    },
    {
      value: `${maxGrade?.toFixed(1) || 0}/10`,
      label: 'ĐIỂM CAO NHẤT',
      color: '#9c27b0',
    },
    {
      value: competingCount || 0,
      label: 'ĐANG THI ĐUA',
      color: '#34a853',
    },
    {
      value: `${currentStreak || 0} ngày`,
      label: 'STREAK HIỆN TẠI',
      color: '#ff9800',
    },
    {
      value: `${bestStreak || 0} ngày`,
      label: 'STREAK CAO NHẤT CỦA BẠN',
      color: '#f57c00',
    },
  ];

  return (
    <>
      <style>{cardHoverStyle}</style>
      <div className="row mb-4">
        {stats.map((stat, index) => (
          <div key={index} className="col-md-3 col-sm-6 mb-3">
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
}

StatCards.propTypes = {
  totalStudents: PropTypes.number,
  avgGrade: PropTypes.number,
  maxGrade: PropTypes.number,
  competingCount: PropTypes.number,
  currentStreak: PropTypes.number,
  bestStreak: PropTypes.number,
};

StatCards.defaultProps = {
  totalStudents: 0,
  avgGrade: 0,
  maxGrade: 0,
  competingCount: 0,
  currentStreak: 0,
  bestStreak: 0,
};

export default StatCards;

