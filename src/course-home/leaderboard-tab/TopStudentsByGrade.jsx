import React, { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { Card, Form, Button, Spinner } from "@openedx/paragon";
import { getConfig } from "@edx/frontend-platform";
import { getAuthenticatedHttpClient } from "@edx/frontend-platform/auth";
import { camelCaseObject } from "@edx/frontend-platform";

// CSS styles for hover animation
const hoverStyles = `
  .leaderboard-row-hover {
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    cursor: pointer;
  }
  .leaderboard-row-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 1;
  }
  .sticky-user-row-top {
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: #e3f2fd !important;
    border-bottom: 2px solid #1976d2;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  .sticky-user-row-bottom {
    position: sticky;
    bottom: 0;
    z-index: 10;
    background-color: #e3f2fd !important;
    border-top: 2px solid #1976d2;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
    transition: opacity 0.3s ease, transform 0.3s ease;
    margin-top: auto;
  }
  .sticky-user-row-top.hidden,
  .sticky-user-row-bottom.hidden {
    opacity: 0;
    pointer-events: none;
  }
`;

function TopStudentsByGrade({ courseId }) {
    const [students, setStudents] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [limit, setLimit] = useState(10);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [currentUserEntry, setCurrentUserEntry] = useState(null);
    const [showStickyUser, setShowStickyUser] = useState(false);
    const [stickyPosition, setStickyPosition] = useState("top"); // 'top' hoặc 'bottom'
    const scrollContainerRef = useRef(null);
    const userRowRef = useRef(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Sử dụng API mới: /api/course_home/top-grades/{courseId}
            const url = `${getConfig().LMS_BASE_URL}/api/course_home/top-grades/${courseId}?limit=${limit}`;
            const { data } = await getAuthenticatedHttpClient().get(url);
            const camelCased = camelCaseObject(data);
            console.log("[TopStudentsByGrade] Data:", camelCased);
            const topStudents = camelCased.topStudents || [];
            setSummary(camelCased.summary || {});

            // Lấy current user entry từ API hoặc trong top
            const currentUserInTop = topStudents.find((s) => s.isCurrentUser);
            const currentUserFromApi = camelCased.currentUserEntry || null;

            // Ưu tiên current user trong top, nếu không có thì dùng từ API
            const currentUser = currentUserInTop || currentUserFromApi;
            setCurrentUserEntry(currentUser);

            setStudents(topStudents);

            // Initial state: không hiển thị sticky
            setShowStickyUser(false);
        } catch (error) {
            console.error("[TopStudentsByGrade] Error fetching data:", error);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    }, [courseId, limit]);

    useEffect(() => {
        if (courseId) {
            fetchData();
        }
    }, [courseId, limit, fetchData]);

    // Handle scroll để ẩn/hiện sticky user row
    useEffect(() => {
        const container = scrollContainerRef.current;
        const userRow = userRowRef.current;

        // Nếu không có currentUserEntry, không cần sticky
        if (!container || !currentUserEntry) {
            setShowStickyUser(false);
            return;
        }

        // Nếu không có userRow (chưa render), không hiển thị sticky
        if (!userRow) {
            setShowStickyUser(false);
            return;
        }

        const handleScroll = () => {
            if (!userRow) {
                setShowStickyUser(false);
                return;
            }

            // Tính toán vị trí tương đối trong scroll container
            const containerScrollTop = container.scrollTop;
            const containerHeight = container.clientHeight;
            const containerScrollBottom = containerScrollTop + containerHeight;

            const userRowOffsetTop = userRow.offsetTop;
            const userRowHeight = userRow.offsetHeight;

            // Kiểm tra xem user row có trong viewport không
            const isUserRowVisible =
                userRowOffsetTop >= containerScrollTop && userRowOffsetTop + userRowHeight <= containerScrollBottom;

            if (isUserRowVisible) {
                // User row đang hiển thị → ẩn sticky
                setShowStickyUser(false);
            } else {
                // User row không hiển thị → hiển thị sticky
                setShowStickyUser(true);

                // Xác định vị trí sticky: trên hay dưới
                if (userRowOffsetTop < containerScrollTop) {
                    // User row ở phía TRÊN (đã scroll qua) → sticky ở TRÊN
                    setStickyPosition("top");
                } else {
                    // User row ở phía DƯỚI (chưa scroll đến) → sticky ở DƯỚI
                    setStickyPosition("bottom");
                }
            }
        };

        container.addEventListener("scroll", handleScroll, { passive: true });
        // Check initial state sau khi render
        const timeoutId = setTimeout(handleScroll, 100);

        return () => {
            container.removeEventListener("scroll", handleScroll);
            clearTimeout(timeoutId);
        };
    }, [currentUserEntry, students]);

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

    return (
        <>
            <style>{hoverStyles}</style>
            <Card className="h-100 shadow-sm" style={{ borderRadius: "12px", overflow: "hidden" }}>
                {/* Header với title rõ ràng */}
                <div
                    className="d-flex justify-content-between align-items-center px-3 py-3"
                    style={{
                        backgroundColor: "#fff",
                        borderBottom: "1px solid #dee2e6",
                    }}
                >
                    <div className="d-flex align-items-center">
                        <span style={{ fontSize: "1.25rem" }} className="mr-2">
                            🏆
                        </span>
                        <span className="font-weight-bold" style={{ fontSize: "1.1rem", color: "#333" }}>
                            Top Điểm Số
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
                            <div className="d-flex align-items-center">
                                <span className="text-muted mr-2" style={{ fontSize: "0.85rem" }}>
                                    Hiển thị:
                                </span>
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
                                        {/* Sticky user row ở trên đầu khi scroll xuống qua user */}
                                        {currentUserEntry && showStickyUser && stickyPosition === "top" && (
                                            <div
                                                className="d-flex align-items-center px-3 py-2 sticky-user-row-top"
                                                style={{
                                                    backgroundColor: "#e3f2fd",
                                                }}
                                            >
                                                <div className="mr-3" style={{ minWidth: "35px" }}>
                                                    {getRankBadge(currentUserEntry.rank)}
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div
                                                        className="d-flex align-items-center"
                                                        style={{ fontSize: "0.9rem" }}
                                                    >
                                                        <span className="font-weight-semibold">
                                                            {currentUserEntry.fullName || currentUserEntry.displayName}
                                                        </span>
                                                        <span
                                                            className="ml-2 px-2 py-0"
                                                            style={{
                                                                backgroundColor: "#1976d2",
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
                                                    style={{
                                                        fontSize: "1rem",
                                                        color: "#f57c00",
                                                    }}
                                                >
                                                    {currentUserEntry.gradePercentage?.toFixed(1) ||
                                                        currentUserEntry.gradePercent?.toFixed(1) ||
                                                        0}
                                                    /10
                                                </div>
                                            </div>
                                        )}

                                        {/* Danh sách students */}
                                        <div style={{ flex: "1 1 auto" }}>
                                            {students.map((student, index) => {
                                                // Set ref cho current user entry (dù ở đâu trong danh sách)
                                                const isCurrentUser = student.isCurrentUser;
                                                return (
                                                    <div
                                                        key={student.userId || index}
                                                        ref={isCurrentUser ? userRowRef : null}
                                                        className="d-flex align-items-center px-3 py-2 border-bottom leaderboard-row-hover"
                                                        style={{
                                                            backgroundColor: isCurrentUser
                                                                ? "#e3f2fd"
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
                                                                            backgroundColor: "#1976d2",
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
                                                            style={{
                                                                fontSize: "1rem",
                                                                color: "#f57c00",
                                                            }}
                                                        >
                                                            {student.gradePercentage?.toFixed(1) ||
                                                                student.gradePercent?.toFixed(1) ||
                                                                0}
                                                            /10
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Sticky user row ở dưới cùng khi scroll lên (user ở dưới) */}
                                        {currentUserEntry && showStickyUser && stickyPosition === "bottom" && (
                                            <div
                                                className="d-flex align-items-center px-3 py-2 sticky-user-row-bottom"
                                                style={{
                                                    backgroundColor: "#e3f2fd",
                                                }}
                                            >
                                                <div className="mr-3" style={{ minWidth: "35px" }}>
                                                    {getRankBadge(currentUserEntry.rank)}
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div
                                                        className="d-flex align-items-center"
                                                        style={{ fontSize: "0.9rem" }}
                                                    >
                                                        <span className="font-weight-semibold">
                                                            {currentUserEntry.fullName || currentUserEntry.displayName}
                                                        </span>
                                                        <span
                                                            className="ml-2 px-2 py-0"
                                                            style={{
                                                                backgroundColor: "#1976d2",
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
                                                    style={{
                                                        fontSize: "1rem",
                                                        color: "#f57c00",
                                                    }}
                                                >
                                                    {currentUserEntry.gradePercentage?.toFixed(1) ||
                                                        currentUserEntry.gradePercent?.toFixed(1) ||
                                                        0}
                                                    /10
                                                </div>
                                            </div>
                                        )}
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

TopStudentsByGrade.propTypes = {
    courseId: PropTypes.string.isRequired,
};

export default TopStudentsByGrade;
