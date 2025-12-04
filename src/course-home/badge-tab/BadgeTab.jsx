import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Container, Spinner, Alert } from "@openedx/paragon";
import { useWindowSize } from "@openedx/paragon";
import { getConfig } from "@edx/frontend-platform";
import { getAuthenticatedHttpClient } from "@edx/frontend-platform/auth";
import { camelCaseObject } from "@edx/frontend-platform";
import { useContextId } from "../../data/hooks";
import { useModel } from "../../generic/model-store";
import { fetchProgressTab } from "../../course-home/data";

import BadgeSummary from "./BadgeSummary";
import BadgeList from "./BadgeList";

// Import Progress Tab components
import ProgressHeader from "../progress-tab/ProgressHeader";
import CourseCompletion from "../progress-tab/course-completion/CourseCompletion";
import ProgressTabCertificateStatusSidePanelSlot from "../../plugin-slots/ProgressTabCertificateStatusSidePanelSlot";
import ProgressTabCertificateStatusMainBodySlot from "../../plugin-slots/ProgressTabCertificateStatusMainBodySlot";
import ProgressTabCourseGradeSlot from "../../plugin-slots/ProgressTabCourseGradeSlot";
import ProgressTabGradeBreakdownSlot from "../../plugin-slots/ProgressTabGradeBreakdownSlot";
import ProgressTabRelatedLinksSlot from "../../plugin-slots/ProgressTabRelatedLinksSlot";

function BadgeTab() {
    const { courseId } = useParams();
    const contextCourseId = useContextId();
    const dispatch = useDispatch();
    const progressModel = useModel('progress', contextCourseId);
    const windowWidth = useWindowSize().width;
    
    const [badgeData, setBadgeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Use ref to track if progress has been fetched (won't cause re-renders)
    const progressFetchedRef = useRef(false);
    const lastCourseIdRef = useRef(null);
    
    // Check if progress data is loaded
    const progressDataLoaded = progressModel && progressModel.completionSummary && progressModel.courseGrade;
    
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

    // Fetch badge data only once when component mounts or courseId changes
    useEffect(() => {
        fetchBadgeData();
    }, [fetchBadgeData]);

    // Fetch progress data only once when component mounts or courseId changes
    useEffect(() => {
        // Reset flag when courseId changes
        if (courseId !== lastCourseIdRef.current) {
            progressFetchedRef.current = false;
            lastCourseIdRef.current = courseId;
        }
        
        // Only fetch if not already fetched and not already loaded
        const isLoaded = progressModel && progressModel.completionSummary && progressModel.courseGrade;
        if (courseId && !progressFetchedRef.current && !isLoaded) {
            progressFetchedRef.current = true;
            dispatch(fetchProgressTab(courseId));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId, dispatch]);

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

            {/* Progress Tab Content - Copied from ProgressTab */}
            {windowWidth !== undefined && progressDataLoaded && (
                <>
                    <div className="mt-5 pt-4 border-top">
                        <ProgressHeader />
                        <div className="row w-100 m-0 mt-3">
                            {/* Main body */}
                            <div className="col-12 col-md-8 p-0">
                                {!progressModel.disableProgressGraph && <CourseCompletion />}
                                <ProgressTabCertificateStatusMainBodySlot />
                                <ProgressTabCourseGradeSlot />
                                <ProgressTabGradeBreakdownSlot />
                            </div>

                            {/* Side panel */}
                            <div className="col-12 col-md-4 p-0 px-md-4">
                                <ProgressTabCertificateStatusSidePanelSlot />
                                <ProgressTabRelatedLinksSlot />
                            </div>
                        </div>
                    </div>
                </>
            )}
            
            {/* Show loading indicator for Progress section if data not loaded yet */}
            {windowWidth !== undefined && !progressDataLoaded && (
                <div className="mt-5 pt-4 border-top text-center">
                    <Spinner animation="border" variant="secondary" size="sm" />
                    <p className="mt-2 text-muted small">Đang tải dữ liệu tiến độ...</p>
                </div>
            )}
        </Container>
    );
}

export default BadgeTab;
