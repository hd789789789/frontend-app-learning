import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getConfig } from "@edx/frontend-platform";
import { getAuthenticatedHttpClient } from "@edx/frontend-platform/auth";
import { camelCaseObject } from "@edx/frontend-platform";
import { injectIntl, intlShape } from "@edx/frontend-platform/i18n";
import { Alert, Container, Spinner } from "@openedx/paragon";
import { Info } from "@openedx/paragon/icons";

import { useModel } from "../../generic/model-store";
import StatCards from "./StatCards";
import TopStudentsByGrade from "./TopStudentsByGrade";
import TopStudentsByProgress from "./TopStudentsByProgress";

function LeaderboardTab({ intl }) {
    const { courseId } = useParams();
    const [summaryData, setSummaryData] = useState({
        totalStudents: 0,
        avgGrade: 0,
        maxGrade: 0,
        competingCount: 0,
    });
    const [summaryLoading, setSummaryLoading] = useState(true);

    const leaderboardData = useModel("leaderboardTab", courseId);

    // Fetch summary data from top-grades API
    useEffect(() => {
        const fetchSummary = async () => {
            if (!courseId) return;

            setSummaryLoading(true);
            try {
                // Sử dụng API mới: /api/course_home/top-grades/{courseId}
                const url = `${getConfig().LMS_BASE_URL}/api/course_home/top-grades/${courseId}?limit=10`;
                const { data } = await getAuthenticatedHttpClient().get(url);
                const camelCased = camelCaseObject(data);
                console.log("[LeaderboardTab] Summary data:", camelCased);

                if (camelCased.summary) {
                    setSummaryData({
                        totalStudents: camelCased.summary.totalStudents || 0,
                        avgGrade: camelCased.summary.avgGrade || 0,
                        maxGrade: camelCased.summary.maxGrade || 0,
                        competingCount: camelCased.summary.topCount || 10,
                    });
                }
            } catch (error) {
                console.error("[LeaderboardTab] Error fetching summary:", error);
            } finally {
                setSummaryLoading(false);
            }
        };

        fetchSummary();
    }, [courseId]);

    const { courseStatus } = useSelector((state) => state.courseHome);

    // Loading state managed by TabContainer
    if (courseStatus === "loading" && summaryLoading) {
        return (
            <Container className="py-5 px-2 px-md-4 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Đang tải bảng xếp hạng...</p>
            </Container>
        );
    }

    // Show error state if data failed to load
    if (courseStatus === "failed") {
        return (
            <Container className="py-5 px-2 px-md-4">
                <Alert variant="danger">
                    <Alert.Heading>Không thể tải bảng xếp hạng</Alert.Heading>
                    <p>Đã xảy ra lỗi khi tải dữ liệu bảng xếp hạng. Vui lòng thử lại sau.</p>
                </Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4 px-3 px-md-4" style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
            {/* Summary Statistics Cards */}
            <StatCards
                totalStudents={summaryData.totalStudents}
                avgGrade={summaryData.avgGrade}
                maxGrade={summaryData.maxGrade}
                competingCount={summaryData.competingCount}
            />

            {/* Two Column Leaderboard Layout */}
            <div className="row">
                {/* Top Students by Grade */}
                <div className="col-lg-6 col-md-6 mb-4">
                    <TopStudentsByGrade courseId={courseId} />
                </div>

                {/* Top Students by Progress */}
                <div className="col-lg-6 col-md-6 mb-4">
                    <TopStudentsByProgress courseId={courseId} />
                </div>
            </div>
        </Container>
    );
}

LeaderboardTab.propTypes = {
    intl: intlShape.isRequired,
};

export default injectIntl(LeaderboardTab);
