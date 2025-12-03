import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '@openedx/paragon';
import { Person, TrendingUp } from '@openedx/paragon/icons';

function CurrentUserRank({ rank, totalStudents, percentile }) {
  return (
    <Card className="mb-4 shadow-sm">
      <Card.Header className="bg-primary text-white">
        <h4 className="mb-0">
          <Person className="mr-2" />
          Your Ranking
        </h4>
      </Card.Header>
      <Card.Body>
        <div className="row">
          <div className="col-md-4 text-center border-right">
            <div className="display-4 font-weight-bold text-primary">{rank}</div>
            <div className="text-muted">Current Rank</div>
          </div>
          <div className="col-md-4 text-center border-right">
            <div className="display-4 font-weight-bold text-success">{totalStudents}</div>
            <div className="text-muted">Total Students</div>
          </div>
          <div className="col-md-4 text-center">
            <div className="display-4 font-weight-bold text-info">
              <TrendingUp className="mr-2" />
              {percentile.toFixed(1)}%
            </div>
            <div className="text-muted">Percentile</div>
          </div>
        </div>
        <div className="mt-3 text-center">
          <small className="text-muted">
            You are performing better than {percentile.toFixed(1)}% of students in this course
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