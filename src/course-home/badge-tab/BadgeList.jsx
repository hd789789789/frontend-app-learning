import React, { useState } from "react";
import PropTypes from "prop-types";
import { Card, Form } from "@openedx/paragon";
import { ChapterBadgeItem } from "./BadgeItem";

// CSS styles for badge list
const listStyles = `
  .badge-filter-btn {
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
    transition: all 0.2s ease;
    border: none;
    cursor: pointer;
  }
  .badge-filter-btn.active {
    background-color: #4caf50;
    color: #fff;
  }
  .badge-filter-btn:not(.active) {
    background-color: #f0f0f0;
    color: #666;
  }
  .badge-filter-btn:hover:not(.active) {
    background-color: #e0e0e0;
  }
`;

function BadgeList({ chapters }) {
    const [filter, setFilter] = useState("all"); // all, completed, incomplete
    const [showUnits, setShowUnits] = useState(false);

    // Filter chapters based on selection
    const filteredChapters = chapters.filter((chapter) => {
        if (filter === "completed") return chapter.isCompleted;
        if (filter === "incomplete") return !chapter.isCompleted;
        return true;
    });

    // Count badges
    const completedChapters = chapters.filter((c) => c.isCompleted).length;
    const completedSections = chapters.reduce(
        (acc, c) => acc + (c.sections?.filter((s) => s.isCompleted).length || 0),
        0
    );
    const totalSections = chapters.reduce(
        (acc, c) => acc + (c.sections?.length || 0),
        0
    );

    return (
        <>
            <style>{listStyles}</style>
            <Card className="shadow-sm" style={{ borderRadius: "12px" }}>
                {/* Header */}
                <div
                    className="d-flex justify-content-between align-items-center px-3 py-3"
                    style={{
                        backgroundColor: "#fff",
                        borderBottom: "1px solid #dee2e6",
                    }}
                >
                    <div className="d-flex align-items-center">
                        <span style={{ fontSize: "1.25rem" }} className="mr-2">
                            🎖️
                        </span>
                        <span className="font-weight-bold" style={{ fontSize: "1.1rem", color: "#333" }}>
                            Danh sách Thành tích
                        </span>
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.85rem" }}>
                        {completedChapters}/{chapters.length} Chương | {completedSections}/{totalSections} Bài
                    </div>
                </div>

                {/* Filter */}
                <div className="px-3 py-2 border-bottom bg-light">
                    <div className="d-flex align-items-center justify-content-between flex-wrap">
                        <div className="d-flex align-items-center">
                            <button
                                className={`badge-filter-btn mr-2 ${filter === "all" ? "active" : ""}`}
                                onClick={() => setFilter("all")}
                            >
                                Tất cả
                            </button>
                            <button
                                className={`badge-filter-btn mr-2 ${filter === "completed" ? "active" : ""}`}
                                onClick={() => setFilter("completed")}
                            >
                                ✓ Đã hoàn thành
                            </button>
                            <button
                                className={`badge-filter-btn ${filter === "incomplete" ? "active" : ""}`}
                                onClick={() => setFilter("incomplete")}
                            >
                                ○ Chưa hoàn thành
                            </button>
                        </div>
                        <label className="d-flex align-items-center mb-0" style={{ fontSize: "0.8rem", cursor: "pointer" }}>
                            <Form.Checkbox
                                checked={showUnits}
                                onChange={(e) => setShowUnits(e.target.checked)}
                                className="mr-1"
                            />
                            Hiển thị Unit
                        </label>
                    </div>
                </div>

                {/* Content */}
                <Card.Body className="p-3" style={{ maxHeight: "600px", overflowY: "auto" }}>
                    {filteredChapters.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <div style={{ fontSize: "3rem" }}>🎯</div>
                            <p className="mt-2">
                                {filter === "completed"
                                    ? "Chưa có thành tích nào hoàn thành"
                                    : filter === "incomplete"
                                    ? "Tất cả thành tích đã hoàn thành! 🎉"
                                    : "Không có dữ liệu"}
                            </p>
                        </div>
                    ) : (
                        filteredChapters.map((chapter, index) => (
                            <ChapterBadgeItem
                                key={chapter.chapterId || index}
                                chapter={chapter}
                                showSections={true}
                                showUnits={showUnits}
                            />
                        ))
                    )}
                </Card.Body>
            </Card>
        </>
    );
}

BadgeList.propTypes = {
    chapters: PropTypes.arrayOf(
        PropTypes.shape({
            chapterId: PropTypes.string,
            chapterName: PropTypes.string,
            isCompleted: PropTypes.bool,
            sections: PropTypes.array,
        })
    ),
};

BadgeList.defaultProps = {
    chapters: [],
};

export default BadgeList;

