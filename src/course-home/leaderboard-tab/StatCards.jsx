import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '@openedx/paragon';

function StatCards({ totalStudents, avgGrade, maxGrade, competingCount }) {
  const stats = [
    {
      value: totalStudents,
      label: 'TỔNG HỌC VIÊN',
      color: '#4285f4',
    },
    {
      value: `${avgGrade?.toFixed(2) || 0}%`,
      label: 'ĐIỂM TRUNG BÌNH',
      color: '#34a853',
    },
    {
      value: `${maxGrade || 0}%`,
      label: 'ĐIỂM CAO NHẤT',
      color: '#9c27b0',
    },
    {
      value: competingCount || 0,
      label: 'ĐANG THI ĐUA',
      color: '#34a853',
    },
  ];

  return (
    <div className="row mb-4">
      {stats.map((stat, index) => (
        <div key={index} className="col-md-3 col-sm-6 mb-3">
          <Card className="h-100 text-center shadow-sm" style={{ borderRadius: '12px' }}>
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
  );
}

StatCards.propTypes = {
  totalStudents: PropTypes.number,
  avgGrade: PropTypes.number,
  maxGrade: PropTypes.number,
  competingCount: PropTypes.number,
};

StatCards.defaultProps = {
  totalStudents: 0,
  avgGrade: 0,
  maxGrade: 0,
  competingCount: 0,
};

export default StatCards;

