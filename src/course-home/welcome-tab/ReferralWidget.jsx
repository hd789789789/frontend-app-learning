import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from '@openedx/paragon';
import './ReferralWidget.scss';

const ReferralWidget = ({ referralData = null }) => {
  // Mock data if not provided
  const data = referralData || {
    referralCode: 'PI2025',
    referralCount: 3,
    referralCoins: 300,
  };

  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(data.referralCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Mời bạn học cùng PiStudy!',
        text: `Sử dụng mã giới thiệu ${data.referralCode} để nhận 50 điểm khi đăng ký!`,
      });
    } else {
      // Fallback: copy to clipboard
      handleCopyCode();
    }
  };

  const handleViewList = () => {
    // TODO: Open referral list modal
    console.log('View referral list');
  };

  const handleEnterCode = () => {
    // TODO: Open enter referral code modal
    console.log('Enter referral code');
  };

  return (
    <Card className="referral-widget-card">
      <Card.Body>
        <div className="referral-widget-content">
          <div className="referral-emoji">🎁</div>
          <h3 className="referral-title">Giới thiệu & Nhận thưởng!</h3>
          <p className="referral-description">
            Mời bạn bè học cùng và nhận <strong>100 💰 điểm</strong> cho mỗi người đăng ký!
          </p>
          
          {/* Referral Code Display */}
          <div className="referral-code-box">
            <div className="referral-code-label">MÃ GIỚI THIỆU CỦA BẠN</div>
            <div className="referral-code-display">
              <div className="referral-code-value">{data.referralCode}</div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCopyCode}
                className="referral-copy-btn"
              >
                {copied ? '✓ Đã copy' : '📋 Copy'}
              </Button>
            </div>
          </div>

          {/* Referral Stats */}
          <div className="referral-stats">
            <div className="referral-stat-item">
              <div className="referral-stat-value">{data.referralCount}</div>
              <div className="referral-stat-label">Người giới thiệu</div>
            </div>
            <div className="referral-stat-item">
              <div className="referral-stat-value coins">{data.referralCoins}</div>
              <div className="referral-stat-label">Điểm kiếm được</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="referral-actions">
            <Button
              variant="primary"
              onClick={handleShare}
              className="referral-share-btn"
            >
              📤 Chia sẻ
            </Button>
            <Button
              variant="outline-primary"
              onClick={handleViewList}
              className="referral-list-btn"
            >
              📋 Danh sách
            </Button>
          </div>

          {/* Enter Referral Code Link */}
          <div className="referral-enter-section">
            <button
              type="button"
              onClick={handleEnterCode}
              className="referral-enter-link"
            >
              🎫 Bạn có mã giới thiệu? Nhập tại đây
            </button>
          </div>

          {/* Reward Info */}
          <div className="referral-reward-info">
            <strong>💎 Cơ chế thưởng:</strong><br />
            • Người được giới thiệu: <strong>+50 điểm</strong><br />
            • Người giới thiệu: <strong>+100 điểm</strong>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

ReferralWidget.propTypes = {
  referralData: PropTypes.shape({
    referralCode: PropTypes.string,
    referralCount: PropTypes.number,
    referralCoins: PropTypes.number,
  }),
};

ReferralWidget.defaultProps = {
  referralData: null,
};

export default ReferralWidget;

