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

    const fetchBadgeData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const url = `${getConfig().LMS_BASE_URL}/api/course_home/badge/${courseId}`;
            const { data } = await getAuthenticatedHttpClient().get(url);
            const camelCased = camelCaseObject(data);
            console.log("[BadgeTab] Data:", camelCased);
            setBadgeData(camelCased);
        } catch (err) {
            console.error("[BadgeTab] Error fetching data:", err);
            setError("Không thể tải dữ liệu Badge. Vui lòng thử lại.");
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
                <p className="mt-3 text-muted">Đang tải dữ liệu Badge...</p>
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
                    Không có dữ liệu Badge cho khóa học này.
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
            <BadgeSummary summary={badgeData.summary} />

            {/* Badge List */}
            <BadgeList chapters={badgeData.chapters || []} />
        </Container>
    );
}

export default BadgeTab;

