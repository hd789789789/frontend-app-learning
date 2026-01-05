import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '@openedx/paragon';
// import { Person, TrendingUp } from '@openedx/paragon/icons'; // May not exist in this version

function CurrentUserRank({ rank, totalStudents, percentile }) {
 

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Header className="bg-primary text-white">
        <h4 className="mb-0">
          <span className="mr-2">👤</span>
          Xếp hạng của bạn
        </h4>
      </Card.Header>
      <Card.Body>
        <div className="row">
          <div className="col-md-4 text-center border-right">
            <div className="display-4 font-weight-bold text-primary">{rank}</div>
            <div className="text-muted">Hạng hiện tại</div>
          </div>
          <div className="col-md-4 text-center border-right">
            <div className="display-4 font-weight-bold text-success">{totalStudents}</div>
            <div className="text-muted">Tổng học viên</div>
          </div>
          <div className="col-md-4 text-center">
            <div className="display-4 font-weight-bold text-info">
              <span className="mr-2">📈</span>
              {(percentile || 0).toFixed(1)}%
            </div>
            <div className="text-muted">Phần trăm vượt trội</div>
          </div>
        </div>
        <div className="mt-3 text-center">
          <small className="text-muted">
            Bạn đang học tốt hơn {(percentile || 0).toFixed(1)}% học viên trong khóa học này
          </small>
        </div>
      </Card.Body>
    </Card>
  );
}

CurrentUserRank.propTypes = {
  rank: PropTypes.number.isRequired,
  totalStudents: PropTypes.number.isRequired,
  percentile: PropTypes.number.isRequired,
};

export default CurrentUserRank;