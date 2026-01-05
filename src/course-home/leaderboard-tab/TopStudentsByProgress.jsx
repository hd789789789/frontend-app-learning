import React, { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { Card, Form, Button, Spinner } from "@openedx/paragon";
import { getConfig } from "@edx/frontend-platform";
import { getAuthenticatedHttpClient } from "@edx/frontend-platform/auth";
import { camelCaseObject } from "@edx/frontend-platform";

// CSS styles for hover animation and sticky
const hoverStyles = `
  .progress-row-hover {
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    cursor: pointer;
  }
  .progress-row-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 1;
  }
  .progress-sticky-top {
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: #e8f5e9 !important;
    border-bottom: 2px solid #4caf50;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  .progress-sticky-bottom {
    position: sticky;
    bottom: 0;
    z-index: 10;
    background-color: #e8f5e9 !important;
    border-top: 2px solid #4caf50;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
`;

function TopStudentsByProgress({ courseId }) {
    const [students, setStudents] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("all");
    const [limit, setLimit] = useState(10);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [currentUserEntry, setCurrentUserEntry] = useState(null);
    const [showStickyUser, setShowStickyUser] = useState(false);
    const [stickyPosition, setStickyPosition] = useState("top");
    const [testMode, setTestMode] = useState(false); // Test mode với 100 mock users
    const scrollContainerRef = useRef(null);
    const userRowRef = useRef(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const testParam = testMode ? "&test=true" : "";
            const url = `${getConfig().LMS_BASE_URL}/api/course_home/top-progress/${courseId}?period=${period}&limit=${limit}${testParam}`;
            const { data } = await getAuthenticatedHttpClient().get(url);
            const camelCased = camelCaseObject(data);
            console.log("[TopStudentsByProgress] Data:", camelCased);
            
            const topStudents = camelCased.topStudents || [];
            setSummary(camelCased.summary || {});

            // Lấy current user entry từ API hoặc trong top
            const currentUserInTop = topStudents.find((s) => s.isCurrentUser);
            const currentUserFromApi = camelCased.currentUserEntry || null;

            // Ưu tiên current user trong top, nếu không có thì dùng từ API
            const currentUser = currentUserInTop || currentUserFromApi;
            setCurrentUserEntry(currentUser);

            setStudents(topStudents);
            setShowStickyUser(false);
        } catch (error) {
            console.error("[TopStudentsByProgress] Error fetching data:", error);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    }, [courseId, period, limit, testMode]);

    useEffect(() => {
        if (courseId) {
            fetchData();
        }
    }, [courseId, period, limit, testMode, fetchData]);

    // Kiểm tra xem user có nằm trong danh sách students không
    const isUserInList = students.some((s) => s.isCurrentUser);

    // Handle scroll để ẩn/hiện sticky user row
    useEffect(() => {
        const container = scrollContainerRef.current;
        const userRow = userRowRef.current;

        // Nếu không có currentUserEntry, không cần sticky
        if (!container || !currentUserEntry) {
            setShowStickyUser(false);
            return;
        }

        // Nếu user KHÔNG nằm trong danh sách students → luôn hiển thị sticky ở dưới
        if (!isUserInList) {
            setShowStickyUser(true);
            setStickyPosition("bottom");
            return;
        }

        // Nếu không có userRow (chưa render), không hiển thị sticky
        if (!userRow) {
            setShowStickyUser(false);
            return;
        }

        const handleScroll = () => {
            if (!userRow) {
                if (!isUserInList && currentUserEntry) {
                    setShowStickyUser(true);
                    setStickyPosition("bottom");
                } else {
                    setShowStickyUser(false);
                }
                return;
            }

            // Sử dụng getBoundingClientRect để tính vị trí chính xác
            const containerRect = container.getBoundingClientRect();
            const userRowRect = userRow.getBoundingClientRect();

            // Kiểm tra xem user row có trong viewport của container không
            const isUserRowVisible =
                userRowRect.top >= containerRect.top &&
                userRowRect.bottom <= containerRect.bottom;

            if (isUserRowVisible) {
                setShowStickyUser(false);
            } else {
                setShowStickyUser(true);
                if (userRowRect.top < containerRect.top) {
                    setStickyPosition("top");
                } else {
                    setStickyPosition("bottom");
                }
            }
        };

        container.addEventListener("scroll", handleScroll, { passive: true });
        const timeoutId = setTimeout(handleScroll, 100);

        return () => {
            container.removeEventListener("scroll", handleScroll);
            clearTimeout(timeoutId);
        };
    }, [currentUserEntry, students, isUserInList]);

    const handleRefresh = () => {
        fetchData();
    };

    const getRankBadge = (rank) => {
        if (rank === 1) {
            return (
                <span
                    className="d-inline-flex align-items-center justify-content-center"
                    style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, #ffd700 0%, #ffb300 100%)",
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                    }}
                >
                    {rank}
                </span>
            );
        }
        if (rank <= 3) {
            return (
                <span
                    className="d-inline-flex align-items-center justify-content-center"
                    style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background:
                            rank === 2
                                ? "linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)"
                                : "linear-gradient(135deg, #CD7F32 0%, #B87333 100%)",
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                    }}
                >
                    {rank}
                </span>
            );
        }
        return (
            <span className="text-muted font-weight-bold" style={{ fontSize: "0.9rem" }}>
                {rank}
            </span>
        );
    };

    const periodButtons = [
        { value: "week", label: "Tuần này" },
        { value: "month", label: "Tháng này" },
        { value: "all", label: "Tất cả" },
    ];

    // Render sticky user row
    const renderStickyUserRow = (position) => {
        if (!currentUserEntry || !showStickyUser || stickyPosition !== position) {
            return null;
        }
        return (
            <div
                className={`d-flex align-items-center px-3 py-2 progress-sticky-${position}`}
                style={{ backgroundColor: "#e8f5e9" }}
            >
                <div className="mr-3" style={{ minWidth: "35px" }}>
                    {getRankBadge(currentUserEntry.rank)}
                </div>
                <div className="flex-grow-1">
                    <div className="d-flex align-items-center" style={{ fontSize: "0.9rem" }}>
                        <span className="font-weight-semibold">
                            {currentUserEntry.fullName || currentUserEntry.displayName}
                        </span>
                        <span
                            className="ml-2 px-2 py-0"
                            style={{
                                backgroundColor: "#4caf50",
                                color: "#fff",
                                borderRadius: "10px",
                                fontSize: "0.65rem",
                                fontWeight: "bold",
                            }}
                        >
                            Bạn
                        </span>
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                        @{currentUserEntry.username}
                    </div>
                </div>
                <div
                    className="font-weight-bold"
                    style={{ fontSize: "1rem", color: "#4caf50" }}
                >
                    {currentUserEntry.progressPercent?.toFixed(1) || 0}%
                </div>
            </div>
        );
    };

    return (
        <>
            <style>{hoverStyles}</style>
            <Card className="h-100 shadow-sm" style={{ borderRadius: "12px", overflow: "hidden" }}>
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
                            ⚡
                        </span>
                        <span className="font-weight-bold" style={{ fontSize: "1.1rem", color: "#333" }}>
                            Top Tiến độ
                        </span>
                    </div>
                    <div className="d-flex align-items-center">
                        <Button
                            variant="link"
                            size="sm"
                            className="p-1 text-muted"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                        >
                            {isCollapsed ? "▼" : "▲"}
                        </Button>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={handleRefresh}
                            className="ml-2"
                            style={{ fontSize: "1rem", padding: "0.25rem 0.5rem" }}
                            title="Tải lại"
                        >
                            ↻
                        </Button>
                    </div>
                </div>

                {!isCollapsed && (
                    <Card.Body className="p-0">
                        {/* Filter */}
                        <div className="px-3 py-2 border-bottom bg-light">
                            <div className="d-flex align-items-center flex-wrap justify-content-between">
                                <div className="d-flex align-items-center">
                                    <div className="btn-group mr-3" role="group">
                                        {periodButtons.map((btn) => (
                                            <button
                                                key={btn.value}
                                                type="button"
                                                className={`btn btn-sm ${
                                                    period === btn.value ? "btn-primary" : "btn-outline-secondary"
                                                }`}
                                                onClick={() => setPeriod(btn.value)}
                                                style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                                            >
                                                {btn.label}
                                            </button>
                                        ))}
                                    </div>
                                    <Form.Control
                                        as="select"
                                        size="sm"
                                        value={limit}
                                        onChange={(e) => setLimit(Number(e.target.value))}
                                        style={{ width: "auto", fontSize: "0.85rem" }}
                                    >
                                        <option value={5}>Top 5</option>
                                        <option value={10}>Top 10</option>
                                        <option value={20}>Top 20</option>
                                        <option value={50}>Top 50</option>
                                    </Form.Control>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        {loading ? (
                            <div className="text-center py-4">
                                <Spinner animation="border" size="sm" />
                                <span className="ml-2 text-muted">Đang tải...</span>
                            </div>
                        ) : (
                            <div
                                ref={scrollContainerRef}
                                style={{
                                    maxHeight: "400px",
                                    overflowY: "auto",
                                    position: "relative",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                {students.length === 0 ? (
                                    <div className="text-center py-4 text-muted">Chưa có dữ liệu</div>
                                ) : (
                                    <>
                                        {/* Sticky top */}
                                        {renderStickyUserRow("top")}

                                        {/* Danh sách students */}
                                        <div style={{ flex: "1 1 auto" }}>
                                            {students.map((student, index) => {
                                                const isCurrentUser = student.isCurrentUser;
                                                return (
                                                    <div
                                                        key={student.userId || index}
                                                        ref={isCurrentUser ? userRowRef : null}
                                                        className="d-flex align-items-center px-3 py-2 border-bottom progress-row-hover"
                                                        style={{
                                                            backgroundColor: isCurrentUser
                                                                ? "#e8f5e9"
                                                                : index % 2 === 0
                                                                ? "#fff"
                                                                : "#f9f9f9",
                                                        }}
                                                    >
                                                        <div className="mr-3" style={{ minWidth: "35px" }}>
                                                            {getRankBadge(student.rank)}
                                                        </div>
                                                        <div className="flex-grow-1">
                                                            <div
                                                                className="d-flex align-items-center"
                                                                style={{ fontSize: "0.9rem" }}
                                                            >
                                                                <span className="font-weight-semibold">
                                                                    {student.fullName || student.displayName}
                                                                </span>
                                                                {isCurrentUser && (
                                                                    <span
                                                                        className="ml-2 px-2 py-0"
                                                                        style={{
                                                                            backgroundColor: "#4caf50",
                                                                            color: "#fff",
                                                                            borderRadius: "10px",
                                                                            fontSize: "0.65rem",
                                                                            fontWeight: "bold",
                                                                        }}
                                                                    >
                                                                        Bạn
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                                                                @{student.username}
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="font-weight-bold"
                                                            style={{ fontSize: "1rem", color: "#4caf50" }}
                                                        >
                                                            {student.progressPercent?.toFixed(1) || 0}%
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Sticky bottom */}
                                        {renderStickyUserRow("bottom")}
                                    </>
                                )}
                            </div>
                        )}
                    </Card.Body>
                )}
            </Card>
        </>
    );
}

TopStudentsByProgress.propTypes = {
    courseId: PropTypes.string.isRequired,
};

export default TopStudentsByProgress;
