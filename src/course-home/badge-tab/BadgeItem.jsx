import React from "react";
import PropTypes from "prop-types";

// Badge icons based on completion status
const BadgeIcon = ({ type, isCompleted, size = "md" }) => {
    const sizeMap = {
        sm: { width: 20, height: 20, fontSize: "0.7rem" },
        md: { width: 28, height: 28, fontSize: "0.85rem" },
        lg: { width: 36, height: 36, fontSize: "1rem" },
    };

    const { width, height, fontSize } = sizeMap[size];

    // Badge colors and icons based on type
    const badgeConfig = {
        chapter: {
            icon: "🏆",
            completedBg: "linear-gradient(135deg, #ffd700 0%, #ffb300 100%)",
            incompleteBg: "#e0e0e0",
            label: "Chương",
        },
        section: {
            icon: "🏅",
            completedBg: "linear-gradient(135deg, #4caf50 0%, #81c784 100%)",
            incompleteBg: "#e0e0e0",
            label: "Bài",
        },
        unit: {
            icon: "✓",
            completedBg: "linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)",
            incompleteBg: "#e0e0e0",
            label: "Unit",
        },
    };

    const config = badgeConfig[type] || badgeConfig.unit;

    return (
        <span
            className="d-inline-flex align-items-center justify-content-center"
            style={{
                width,
                height,
                borderRadius: "50%",
                background: isCompleted ? config.completedBg : config.incompleteBg,
                color: isCompleted ? "#fff" : "#999",
                fontWeight: "bold",
                fontSize,
                boxShadow: isCompleted ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                transition: "all 0.3s ease",
            }}
            title={isCompleted ? `${config.label} đã hoàn thành` : `${config.label} chưa hoàn thành`}
        >
            {isCompleted ? config.icon : "○"}
        </span>
    );
};

BadgeIcon.propTypes = {
    type: PropTypes.oneOf(["chapter", "section", "unit"]).isRequired,
    isCompleted: PropTypes.bool.isRequired,
    size: PropTypes.oneOf(["sm", "md", "lg"]),
};

// Unit Badge Item
const UnitBadgeItem = ({ unit }) => (
    <div 
        className="d-flex align-items-center py-2 px-3"
        style={{
            backgroundColor: unit.isCompleted ? "#e3f2fd" : "#fff",
            borderRadius: "8px",
            marginBottom: "4px",
        }}
    >
        <BadgeIcon type="unit" isCompleted={unit.isCompleted} size="sm" />
        <span className="ml-2" style={{ fontSize: "0.85rem" }}>
            {unit.unitName}
        </span>
        {unit.isCompleted && unit.completedAt && (
            <span className="ml-auto text-muted" style={{ fontSize: "0.7rem" }}>
                {new Date(unit.completedAt).toLocaleDateString("vi-VN")}
            </span>
        )}
    </div>
);

UnitBadgeItem.propTypes = {
    unit: PropTypes.shape({
        unitId: PropTypes.string,
        unitName: PropTypes.string,
        isCompleted: PropTypes.bool,
        completedAt: PropTypes.string,
    }).isRequired,
};

// Section Badge Item
const SectionBadgeItem = ({ section, showUnits = false }) => {
    const [expanded, setExpanded] = React.useState(false);

    return (
        <div 
            className="mb-3"
            style={{
                backgroundColor: section.isCompleted ? "#e8f5e9" : "#f5f5f5",
                borderRadius: "10px",
                padding: "12px",
                border: section.isCompleted ? "2px solid #4caf50" : "1px solid #e0e0e0",
            }}
        >
            <div 
                className="d-flex align-items-center cursor-pointer"
                onClick={() => setExpanded(!expanded)}
                style={{ cursor: "pointer" }}
            >
                <BadgeIcon type="section" isCompleted={section.isCompleted} size="md" />
                <div className="ml-3 flex-grow-1">
                    <div className="font-weight-semibold" style={{ fontSize: "0.95rem" }}>
                        {section.sectionName}
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                        {section.completedUnits}/{section.totalUnits} Unit hoàn thành
                    </div>
                </div>
                {showUnits && section.units && section.units.length > 0 && (
                    <span style={{ fontSize: "0.9rem", color: "#666" }}>
                        {expanded ? "▲" : "▼"}
                    </span>
                )}
            </div>

            {/* Units list */}
            {showUnits && expanded && section.units && section.units.length > 0 && (
                <div className="mt-3 ml-4">
                    {section.units.map((unit, index) => (
                        <UnitBadgeItem key={unit.unitId || index} unit={unit} />
                    ))}
                </div>
            )}
        </div>
    );
};

SectionBadgeItem.propTypes = {
    section: PropTypes.shape({
        sectionId: PropTypes.string,
        sectionName: PropTypes.string,
        isCompleted: PropTypes.bool,
        completedAt: PropTypes.string,
        totalUnits: PropTypes.number,
        completedUnits: PropTypes.number,
        units: PropTypes.array,
    }).isRequired,
    showUnits: PropTypes.bool,
};

// Chapter Badge Item
const ChapterBadgeItem = ({ chapter, showSections = true, showUnits = false }) => {
    const [expanded, setExpanded] = React.useState(true);

    return (
        <div 
            className="mb-4"
            style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                overflow: "hidden",
            }}
        >
            {/* Chapter Header */}
            <div 
                className="d-flex align-items-center p-3"
                style={{
                    backgroundColor: chapter.isCompleted ? "#fff9e6" : "#fafafa",
                    borderBottom: "1px solid #eee",
                    cursor: "pointer",
                }}
                onClick={() => setExpanded(!expanded)}
            >
                <BadgeIcon type="chapter" isCompleted={chapter.isCompleted} size="lg" />
                <div className="ml-3 flex-grow-1">
                    <div className="font-weight-bold" style={{ fontSize: "1.1rem" }}>
                        {chapter.chapterName}
                    </div>
                    <div className="d-flex align-items-center mt-1">
                        <span 
                            className="badge mr-2"
                            style={{
                                backgroundColor: chapter.isCompleted ? "#ffd700" : "#e0e0e0",
                                color: chapter.isCompleted ? "#333" : "#666",
                                fontSize: "0.7rem",
                                padding: "3px 8px",
                            }}
                        >
                            {chapter.completedSections}/{chapter.totalSections} Bài
                        </span>
                        {chapter.isCompleted && (
                            <span 
                                className="badge"
                                style={{
                                    backgroundColor: "#4caf50",
                                    color: "#fff",
                                    fontSize: "0.7rem",
                                    padding: "3px 8px",
                                }}
                            >
                                ✓ Hoàn thành
                            </span>
                        )}
                    </div>
                </div>
                <span style={{ fontSize: "1rem", color: "#666" }}>
                    {expanded ? "▲" : "▼"}
                </span>
            </div>

            {/* Sections list */}
            {showSections && expanded && chapter.sections && chapter.sections.length > 0 && (
                <div className="p-3">
                    {chapter.sections.map((section, index) => (
                        <SectionBadgeItem 
                            key={section.sectionId || index} 
                            section={section} 
                            showUnits={showUnits}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

ChapterBadgeItem.propTypes = {
    chapter: PropTypes.shape({
        chapterId: PropTypes.string,
        chapterName: PropTypes.string,
        isCompleted: PropTypes.bool,
        completedAt: PropTypes.string,
        totalSections: PropTypes.number,
        completedSections: PropTypes.number,
        sections: PropTypes.array,
    }).isRequired,
    showSections: PropTypes.bool,
    showUnits: PropTypes.bool,
};

export { BadgeIcon, UnitBadgeItem, SectionBadgeItem, ChapterBadgeItem };
export default ChapterBadgeItem;

