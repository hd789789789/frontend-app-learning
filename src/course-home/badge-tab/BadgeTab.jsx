import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Container, Spinner, Alert } from "@openedx/paragon";
import { getConfig } from "@edx/frontend-platform";
import { getAuthenticatedHttpClient } from "@edx/frontend-platform/auth";
import { camelCaseObject } from "@edx/frontend-platform";

import BadgeSummary from "./BadgeSummary";
import BadgeList from "./BadgeList";

function BadgeTab() {
    // Force log immediately - if this doesn't show, component is not rendering
    console.log("[BadgeTab] ====== COMPONENT RENDERING ======");
    console.log("[BadgeTab] React version:", React.version);
    console.log("[BadgeTab] All imports successful");
    
    let courseId;
    try {
        const params = useParams();
        courseId = params?.courseId;
        console.log("[BadgeTab] courseId from useParams:", courseId);
    } catch (err) {
        console.error("[BadgeTab] Error in useParams:", err);
        return (
            <Container className="py-4">
                <Alert variant="danger">
                    <Alert.Heading>Lỗi useParams</Alert.Heading>
                    <p>{err.message}</p>
                </Alert>
            </Container>
        );
    }
    
    const [badgeData, setBadgeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Early return if no courseId
    if (!courseId) {
        console.warn("[BadgeTab] No courseId found!");
        return (
            <Container className="py-4">
                <Alert variant="warning">
                    <Alert.Heading>Lỗi</Alert.Heading>
                    <p>Không tìm thấy courseId trong URL.</p>
                </Alert>
            </Container>
        );
    }

    // Debug: Log khi component mount
    useEffect(() => {
        console.log("[BadgeTab] Component mounted, courseId:", courseId);
    }, [courseId]);

    const fetchBadgeData = useCallback(async () => {
        console.log("[BadgeTab] fetchBadgeData called, courseId:", courseId);
        setLoading(true);
        setError(null);
        try {
            // Encode courseId properly for URL
            const encodedCourseId = encodeURIComponent(courseId);
            const url = `${getConfig().LMS_BASE_URL}/api/course_home/badge/${encodedCourseId}`;
            console.log("[BadgeTab] Fetching from URL:", url);
            
            const response = await getAuthenticatedHttpClient().get(url);
            const { data } = response;
            
            // Check if response is HTML instead of JSON (API not deployed)
            if (typeof data === 'string' && (data.includes('<!DOCTYPE') || data.includes('<html'))) {
                console.error("[BadgeTab] API returned HTML instead of JSON - API may not be deployed");
                setError("API Badge chưa được deploy trên server. Vui lòng liên hệ admin để cập nhật backend.");
                return;
            }
            
            // Check if data is valid object
            if (!data || typeof data !== 'object') {
                console.error("[BadgeTab] Invalid response data:", data);
                setError("Dữ liệu trả về không hợp lệ.");
                return;
            }
            
            const camelCased = camelCaseObject(data);
            console.log("[BadgeTab] Data:", camelCased);
            setBadgeData(camelCased);
        } catch (err) {
            console.error("[BadgeTab] Error fetching data:", err);
            const status = err?.response?.status;
            if (status === 404) {
                setError("API Badge không tồn tại trên server (404). Vui lòng deploy backend Badge API.");
            } else if (status === 401 || status === 403) {
                setError("Bạn không có quyền truy cập dữ liệu Badge.");
            } else {
                setError(`Không thể tải dữ liệu Badge: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        if (courseId) {
            fetchBadgeData();
        }
    }, [courseId, fetchBadgeData]);

    // Always render something for debugging
    console.log("[BadgeTab] Render state - loading:", loading, "error:", error, "badgeData:", badgeData);

    if (loading) {
        console.log("[BadgeTab] Rendering loading state");
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Đang tải dữ liệu Badge...</p>
                <p className="text-muted small">courseId: {courseId}</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-4">
                <Alert variant="danger">
                    <Alert.Heading>Lỗi</Alert.Heading>
                    <p>{error}</p>
                    <button 
                        className="btn btn-outline-danger btn-sm"
                        onClick={fetchBadgeData}
                    >
                        Thử lại
                    </button>
                </Alert>
            </Container>
        );
    }

    if (!badgeData || !badgeData.success) {
        return (
            <Container className="py-4">
                <Alert variant="warning">
                    <Alert.Heading>Không có dữ liệu Badge</Alert.Heading>
                    <p>Không thể tải dữ liệu Badge cho khóa học này.</p>
                    <p className="text-muted small">
                        Có thể API badge chưa được cập nhật trên server. 
                        Vui lòng liên hệ admin.
                    </p>
                    <hr />
                    <p className="mb-0 small">
                        <strong>Debug info:</strong> courseId = {courseId}
                        <br />
                        badgeData = {JSON.stringify(badgeData, null, 2)}
                    </p>
                    <button 
                        className="btn btn-outline-warning btn-sm mt-2"
                        onClick={fetchBadgeData}
                    >
                        Thử lại
                    </button>
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            {/* Page Title */}
            <div className="d-flex align-items-center mb-4">
                <span style={{ fontSize: "2rem" }} className="mr-3">🎖️</span>
                <div>
                    <h2 className="mb-0" style={{ fontWeight: "bold" }}>
                        Badge & Thành tựu
                    </h2>
                    <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                        Theo dõi tiến độ hoàn thành khóa học
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            {BadgeSummary ? (
                <BadgeSummary summary={badgeData.summary} />
            ) : (
                <Alert variant="warning">BadgeSummary component not loaded</Alert>
            )}

            {/* Badge List */}
            {BadgeList ? (
                <BadgeList chapters={badgeData.chapters || []} />
            ) : (
                <Alert variant="warning">BadgeList component not loaded</Alert>
            )}
        </Container>
    );
}

export default BadgeTab;

