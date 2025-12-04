import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Container, Spinner, Alert } from "@openedx/paragon";
import { getConfig } from "@edx/frontend-platform";
import { getAuthenticatedHttpClient } from "@edx/frontend-platform/auth";
import { camelCaseObject } from "@edx/frontend-platform";

import BadgeSummary from "./BadgeSummary";
import BadgeList from "./BadgeList";

function BadgeTab() {
    const { courseId } = useParams();
    
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


    const fetchBadgeData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Encode courseId properly for URL
            const encodedCourseId = encodeURIComponent(courseId);
            const url = `${getConfig().LMS_BASE_URL}/api/course_home/badge/${encodedCourseId}`;
            
            const response = await getAuthenticatedHttpClient().get(url);
            const { data } = response;
            
            // Check if response is HTML instead of JSON (API not deployed)
            if (typeof data === 'string' && (data.includes('<!DOCTYPE') || data.includes('<html'))) {
                setError("API Thành tích chưa được deploy trên server. Vui lòng liên hệ admin để cập nhật backend.");
                return;
            }
            
            // Check if data is valid object
            if (!data || typeof data !== 'object') {
                setError("Dữ liệu trả về không hợp lệ.");
                return;
            }
            
            const camelCased = camelCaseObject(data);
            setBadgeData(camelCased);
        } catch (err) {
            const status = err?.response?.status;
            if (status === 404) {
                setError("API Thành tích không tồn tại trên server (404). Vui lòng deploy backend Thành tích API.");
            } else if (status === 401 || status === 403) {
                setError("Bạn không có quyền truy cập dữ liệu Thành tích.");
            } else {
                setError(`Không thể tải dữ liệu Thành tích: ${err.message}`);
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

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Đang tải dữ liệu Thành tích...</p>
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
                    <Alert.Heading>Không có dữ liệu Thành tích</Alert.Heading>
                    <p>Không thể tải dữ liệu Thành tích cho khóa học này.</p>
                    <p className="text-muted small">
                        Có thể API thành tích chưa được cập nhật trên server. 
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
                        Thành tích & Thành tựu
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

