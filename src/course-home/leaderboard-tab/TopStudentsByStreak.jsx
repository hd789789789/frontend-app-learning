import React, { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { Card, Form, Button, Spinner } from "@openedx/paragon";
import { getConfig } from "@edx/frontend-platform";
import { getAuthenticatedHttpClient } from "@edx/frontend-platform/auth";
import { camelCaseObject } from "@edx/frontend-platform";

// CSS styles for hover animation and sticky row
const hoverStyles = `
  .streak-row-hover {
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    cursor: pointer;
  }
  .streak-row-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 1;
  }
  .streak-sticky-top {
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: #fff3e0 !important;
    border-bottom: 2px solid #ff9800;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  .streak-sticky-bottom {
    position: sticky;
    bottom: 0;
    z-index: 10;
    background-color: #fff3e0 !important;
    border-top: 2px solid #ff9800;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
`;

function TopStudentsByStreak({ courseId, onSummaryChange }) {
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(10);
  const [mode, setMode] = useState("current"); // 'current' | 'best'
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUserEntry, setCurrentUserEntry] = useState(null);
  const [showStickyUser, setShowStickyUser] = useState(false);
  const [stickyPosition, setStickyPosition] = useState("top");
  const [testMode, setTestMode] = useState(false);
  const scrollContainerRef = useRef(null);
  const userRowRef = useRef(null);
  const onSummaryChangeRef = useRef(onSummaryChange);
  const isFetchingRef = useRef(false);
  const lastParamsRef = useRef({ courseId: null, limit: null, mode: null, testMode: null });

  // Keep onSummaryChange ref up to date
  useEffect(() => {
    onSummaryChangeRef.current = onSummaryChange;
  }, [onSummaryChange]);

  useEffect(() => {
    if (!courseId) {
      return;
    }

    // Check if any parameter actually changed
    const paramsChanged = 
      lastParamsRef.current.courseId !== courseId ||
      lastParamsRef.current.limit !== limit ||
      lastParamsRef.current.mode !== mode ||
      lastParamsRef.current.testMode !== testMode;

    // If nothing changed or already fetching, skip
    if (!paramsChanged || isFetchingRef.current) {
      return;
    }

    // Update last params
    lastParamsRef.current = { courseId, limit, mode, testMode };
    isFetchingRef.current = true;

    // Fetch data directly in useEffect to avoid dependency issues
    const fetchData = async () => {
      setLoading(true);
      try {
        const testParam = testMode ? "&test=true" : "";
        const modeParam = `&mode=${mode}`;
        const url = `${getConfig().LMS_BASE_URL}/api/course_home/top-streak/${courseId}?limit=${limit}${modeParam}${testParam}`;
        const { data } = await getAuthenticatedHttpClient().get(url);
        const camelCased = camelCaseObject(data);

        const topStudents = camelCased.topStudents || [];
        setSummary(camelCased.summary || {});

        const currentUserInTop = topStudents.find((s) => s.isCurrentUser);
        const currentUserFromApi = camelCased.currentUserEntry || null;
        const currentUser = currentUserInTop || currentUserFromApi || null;
        setCurrentUserEntry(currentUser);

        if (onSummaryChangeRef.current && currentUser) {
          onSummaryChangeRef.current({
            currentStreak: currentUser.currentStreak || 0,
            longestEverStreak: currentUser.longestEverStreak || 0,
          });
        }

        setStudents(topStudents);
        setShowStickyUser(false);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[TopStudentsByStreak] Error fetching data:", error);
        setStudents([]);
        // Reset params on error so we can retry
        lastParamsRef.current = { courseId: null, limit: null, mode: null, testMode: null };
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchData();
  }, [courseId, limit, mode, testMode]);

  const handleRefresh = () => {
    // Prevent multiple simultaneous refreshes
    if (isFetchingRef.current) {
      return;
    }

    // Reset last params to force a new fetch
    lastParamsRef.current = { courseId: null, limit: null, mode: null, testMode: null };
    isFetchingRef.current = true;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const testParam = testMode ? "&test=true" : "";
        const modeParam = `&mode=${mode}`;
        const url = `${getConfig().LMS_BASE_URL}/api/course_home/top-streak/${courseId}?limit=${limit}${modeParam}${testParam}`;
        const { data } = await getAuthenticatedHttpClient().get(url);
        const camelCased = camelCaseObject(data);

        const topStudents = camelCased.topStudents || [];
        setSummary(camelCased.summary || {});

        const currentUserInTop = topStudents.find((s) => s.isCurrentUser);
        const currentUserFromApi = camelCased.currentUserEntry || null;
        const currentUser = currentUserInTop || currentUserFromApi || null;
        setCurrentUserEntry(currentUser);

        if (onSummaryChangeRef.current && currentUser) {
          onSummaryChangeRef.current({
            currentStreak: currentUser.currentStreak || 0,
            longestEverStreak: currentUser.longestEverStreak || 0,
          });
        }

        setStudents(topStudents);
        setShowStickyUser(false);
        // Update last params after successful fetch
        lastParamsRef.current = { courseId, limit, mode, testMode };
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[TopStudentsByStreak] Error fetching data:", error);
        setStudents([]);
        lastParamsRef.current = { courseId: null, limit: null, mode: null, testMode: null };
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchData();
  };

  const isUserInList = students.some((s) => s.isCurrentUser);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const userRow = userRowRef.current;

    if (!container || !currentUserEntry) {
      setShowStickyUser(false);
      return;
    }

    if (!isUserInList) {
      setShowStickyUser(true);
      setStickyPosition("bottom");
      return;
    }

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

      const containerRect = container.getBoundingClientRect();
      const userRowRect = userRow.getBoundingClientRect();

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

  const renderStickyUserRow = (position) => {
    if (!currentUserEntry || !showStickyUser || stickyPosition !== position) {
      return null;
    }
    return (
      <div
        className={`d-flex align-items-center px-3 py-2 streak-sticky-${position}`}
        style={{ backgroundColor: "#fff3e0" }}
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
                backgroundColor: "#ff9800",
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
          style={{ fontSize: "1rem", color: "#ff9800" }}
        >
          {currentUserEntry.currentStreak || 0} ngày
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{hoverStyles}</style>
      <Card className="h-100 shadow-sm" style={{ borderRadius: "12px", overflow: "hidden" }}>
        <div
          className="d-flex justify-content-between align-items-center px-3 py-3"
          style={{
            backgroundColor: "#fff",
            borderBottom: "1px solid #dee2e6",
          }}
        >
          <div className="d-flex align-items-center">
            <span style={{ fontSize: "1.25rem" }} className="mr-2">
              🔥
            </span>
            <span className="font-weight-bold" style={{ fontSize: "1.1rem", color: "#333" }}>
              {mode === "current" ? "Top Streak hiện tại" : "Top Streak cao nhất"}
            </span>
          </div>
          <div className="d-flex align-items-center">
            <div className="btn-group mr-2" role="group" aria-label="Streak mode toggle">
              <button
                type="button"
                className={`btn btn-sm ${mode === "current" ? "btn-warning" : "btn-outline-warning"}`}
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                onClick={() => setMode("current")}
              >
                Hiện tại
              </button>
              <button
                type="button"
                className={`btn btn-sm ${mode === "best" ? "btn-warning" : "btn-outline-warning"}`}
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                onClick={() => setMode("best")}
              >
                Cao nhất
              </button>
            </div>
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
              <div className="d-flex align-items-center justify-content-between">
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
                <label
                  className="d-flex align-items-center mb-0"
                  style={{ fontSize: "0.75rem", cursor: "pointer" }}
                >
                  <input
                    type="checkbox"
                    checked={testMode}
                    onChange={(e) => setTestMode(e.target.checked)}
                    className="mr-1"
                  />
                  <span className="text-muted">Test 100</span>
                </label>
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
                    {renderStickyUserRow("top")}

                    <div style={{ flex: "1 1 auto" }}>
                      {students.map((student, index) => {
                        const isCurrentUser = student.isCurrentUser;
                        return (
                          <div
                            key={student.userId || index}
                            ref={isCurrentUser ? userRowRef : null}
                            className="d-flex align-items-center px-3 py-2 border-bottom streak-row-hover"
                            style={{
                              backgroundColor: isCurrentUser
                                ? "#fff3e0"
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
                                      backgroundColor: "#ff9800",
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
                              style={{ fontSize: "1rem", color: "#ff9800" }}
                            >
                              {student.currentStreak || 0} ngày
                            </div>
                          </div>
                        );
                      })}
                    </div>

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

TopStudentsByStreak.propTypes = {
  courseId: PropTypes.string.isRequired,
  onSummaryChange: PropTypes.func,
};

TopStudentsByStreak.defaultProps = {
  onSummaryChange: null,
};

export default TopStudentsByStreak;


