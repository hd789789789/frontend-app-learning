import React from "react";
import PropTypes from "prop-types";
import { Card } from "@openedx/paragon";

// CSS styles for badge summary
const summaryStyles = `
  .badge-summary-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    cursor: pointer;
  }
  .badge-summary-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12) !important;
  }
  .badge-progress-bar {
    height: 8px;
    border-radius: 4px;
    background-color: #e9ecef;
    overflow: hidden;
  }
  .badge-progress-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
  }
`;

function BadgeSummary({ summary }) {
    const stats = [
        {
            icon: "🏆",
            label: "Chương",
            completed: summary?.completedChapters || 0,
            total: summary?.totalChapters || 0,
            color: "#ffd700",
            bgColor: "#fff9e6",
        },
        {
            icon: "🏅",
            label: "Bài",
            completed: summary?.completedSections || 0,
            total: summary?.totalSections || 0,
            color: "#4caf50",
            bgColor: "#e8f5e9",
        },
        {
            icon: "📝",
            label: "Unit",
            completed: summary?.completedUnits || 0,
            total: summary?.totalUnits || 0,
            color: "#2196f3",
            bgColor: "#e3f2fd",
        },
    ];

    const completionPercentage = summary?.completionPercentage || 0;

    return (
        <>
            <style>{summaryStyles}</style>
            
            {/* Progress Bar */}
            <Card className="mb-4 shadow-sm" style={{ borderRadius: "12px" }}>
                <Card.Body className="py-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="font-weight-bold" style={{ fontSize: "1rem" }}>
                            Tiến độ hoàn thành Thành tích
                        </span>
                        <span 
                            className="font-weight-bold" 
                            style={{ fontSize: "1.2rem", color: "#4caf50" }}
                        >
                            {completionPercentage.toFixed(1)}%
                        </span>
                    </div>
                    <div className="badge-progress-bar">
                        <div 
                            className="badge-progress-fill"
                            style={{ 
                                width: `${completionPercentage}%`,
                                background: `linear-gradient(90deg, #4caf50 0%, #81c784 100%)`,
                            }}
                        />
                    </div>
                </Card.Body>
            </Card>

            {/* Summary Cards */}
            <div className="row mb-4">
                {stats.map((stat, index) => (
                    <div key={index} className="col-md-4 mb-3">
                        <Card 
                            className="h-100 text-center shadow-sm badge-summary-card" 
                            style={{ borderRadius: "12px", backgroundColor: stat.bgColor }}
                        >
                            <Card.Body className="py-4">
                                <div style={{ fontSize: "2rem" }} className="mb-2">
                                    {stat.icon}
                                </div>
                                <div
                                    className="display-4 font-weight-bold mb-1"
                                    style={{ color: stat.color, fontSize: "2rem" }}
                                >
                                    {stat.completed}/{stat.total}
                                </div>
                                <div
                                    className="text-muted text-uppercase"
                                    style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}
                                >
                                    {stat.label} hoàn thành
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                ))}
            </div>
        </>
    );
}

BadgeSummary.propTypes = {
    summary: PropTypes.shape({
        totalChapters: PropTypes.number,
        completedChapters: PropTypes.number,
        totalSections: PropTypes.number,
        completedSections: PropTypes.number,
        totalUnits: PropTypes.number,
        completedUnits: PropTypes.number,
        completionPercentage: PropTypes.number,
    }),
};

BadgeSummary.defaultProps = {
    summary: {
        totalChapters: 0,
        completedChapters: 0,
        totalSections: 0,
        completedSections: 0,
        totalUnits: 0,
        completedUnits: 0,
        completionPercentage: 0,
    },
};

export default BadgeSummary;

