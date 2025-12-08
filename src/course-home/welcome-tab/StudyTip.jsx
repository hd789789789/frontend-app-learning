import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '@openedx/paragon';
import './StudyTip.scss';

const StudyTip = ({ tip = null }) => {
  const displayTip = tip || {
    title: '💡 Mẹo học tập',
    content: 'Học 25 phút, nghỉ 5 phút (Pomodoro) sẽ giúp bạn tập trung tốt hơn và ghi nhớ lâu hơn!',
  };

  return (
    <Card className="study-tip-card">
      <Card.Body>
        <h3 className="study-tip-title">{displayTip.title}</h3>
        <p className="study-tip-content">{displayTip.content}</p>
      </Card.Body>
    </Card>
  );
};

StudyTip.propTypes = {
  tip: PropTypes.shape({
    title: PropTypes.string,
    content: PropTypes.string,
  }),
};

StudyTip.defaultProps = {
  tip: null,
};

export default StudyTip;

