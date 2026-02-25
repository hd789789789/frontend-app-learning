import { APP_INIT_ERROR, APP_READY, subscribe, initialize, mergeConfig, getConfig } from "@edx/frontend-platform";
import { AppProvider, ErrorPage, PageWrap } from "@edx/frontend-platform/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { lazy, Suspense } from 'react';

import { Helmet } from "react-helmet";
import { fetchDiscussionTab, fetchLiveTab } from "./course-home/data/thunks";
import DiscussionTab from "./course-home/discussion-tab/DiscussionTab";
import TeamsTab from "./course-home/teams-tab/TeamsTab";
import { StudyGroupsTab } from "./course-home/study-groups-tab";

import messages from "./i18n";
import { UserMessagesProvider } from "./generic/user-messages";

import "./index.scss";
import { CourseExit } from "./courseware/course/course-exit";
import CoursewareContainer from "./courseware";
import CoursewareRedirectLandingPage from "./courseware/CoursewareRedirectLandingPage";
import DatesTab from "./course-home/dates-tab";
import GoalUnsubscribe from "./course-home/goal-unsubscribe";
import LeaderboardTab from "./course-home/leaderboard-tab";
import { BadgeTab } from "./course-home/badge-tab";
import ProgressTab from "./course-home/progress-tab/ProgressTab";
import WelcomeTab from "./course-home/welcome-tab";

// Lazy loading for course home tabs
const OutlineTab = lazy(() => import("./course-home/outline-tab"));
import { TabContainer } from "./tab-page";

import { fetchDatesTab, fetchLeaderboardTab, fetchBadgeTab, fetchOutlineTab, fetchProgressTab, fetchTeamsTab, fetchWelcomeTab, fetchStudyGroupsTab } from "./course-home/data";
import { fetchCourse } from "./courseware/data";
import { store } from "./store";
import NoticesProvider from "./generic/notices";
import PathFixesProvider from "./generic/path-fixes";
import LiveTab from "./course-home/live-tab/LiveTab";
import CourseAccessErrorPage from "./generic/CourseAccessErrorPage";
import DecodePageRoute from "./decode-page-route";
import { DECODE_ROUTES, ROUTES } from "./constants";
import PreferencesUnsubscribe from "./preferences-unsubscribe";
import PageNotFound from "./generic/PageNotFound";

// THÊM IMPORT NÀY
import { TextReplacerProvider } from "./generic/text-replacer/TextReplacer";

// Component to redirect from /course/:courseId to /course/:courseId/home (OUTLINE tab - default)
// Only redirect if we're at the exact base course path (not a sub-path)
const CourseHomeRedirect = () => {
    const { courseId } = useParams();
    const location = useLocation();
    const pathname = location.pathname;
    
    // Remove trailing slash for comparison
    const normalizedPathname = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    const expectedBasePath = `/course/${courseId}`;
    
    // Only redirect if pathname is EXACTLY /course/:courseId (no additional path segments)
    // Split pathname to check number of segments
    const pathSegments = normalizedPathname.split('/').filter(Boolean);
    const expectedSegments = expectedBasePath.split('/').filter(Boolean);
    
    // Only redirect if:
    // 1. Pathname matches expected base path exactly
    // 2. Number of segments is exactly 2 (course and courseId)
    // 3. NOT /course/:courseId/home, /course/:courseId/welcome, etc.
    if (normalizedPathname === expectedBasePath && pathSegments.length === expectedSegments.length) {
        console.log(`[CourseHomeRedirect] Redirecting from ${pathname} to /course/${courseId}/home`);
        return <Navigate to={`/course/${courseId}/home`} replace />;
    }
    
    console.log(`[CourseHomeRedirect] No redirect - pathname: ${pathname}, normalized: ${normalizedPathname}, expected: ${expectedBasePath}, segments: ${pathSegments.length} vs ${expectedSegments.length}`);
    
    // Otherwise, don't redirect - let other routes handle it
    return null;
};

// Component to redirect from /course/:courseId/course to /course/:courseId/home
const CourseOutlineRedirect = () => {
    const { courseId } = useParams();
    return <Navigate to={`/course/${courseId}/home`} replace />;
};

subscribe(APP_READY, () => {
    const root = createRoot(document.getElementById("root"));

    root.render(
        <StrictMode>
            <AppProvider store={store}>
                <Helmet>
                    <link rel="shortcut icon" href={getConfig().FAVICON_URL} type="image/x-icon" />
                </Helmet>
                <PathFixesProvider>
                    <NoticesProvider>
                        <UserMessagesProvider>
                            <TextReplacerProvider>
                                <Routes>
                                    <Route
                                        path="*"
                                        element={
                                            <PageWrap>
                                                <PageNotFound />
                                            </PageWrap>
                                        }
                                    />
                                    <Route
                                        path={ROUTES.UNSUBSCRIBE}
                                        element={
                                            <PageWrap>
                                                <GoalUnsubscribe />
                                            </PageWrap>
                                        }
                                    />
                                    <Route
                                        path={ROUTES.REDIRECT}
                                        element={
                                            <PageWrap>
                                                <CoursewareRedirectLandingPage />
                                            </PageWrap>
                                        }
                                    />
                                    <Route
                                        path={ROUTES.PREFERENCES_UNSUBSCRIBE}
                                        element={
                                            <PageWrap>
                                                <PreferencesUnsubscribe />
                                            </PageWrap>
                                        }
                                    />
                                    <Route
                                        path={DECODE_ROUTES.ACCESS_DENIED}
                                        element={
                                            <DecodePageRoute>
                                                <CourseAccessErrorPage />
                                            </DecodePageRoute>
                                        }
                                    />
                                    {/* WELCOME route - handles /course/:courseId/welcome (Chào mừng tab) */}
                                    <Route
                                        path={DECODE_ROUTES.WELCOME}
                                        element={
                                            <DecodePageRoute>
                                                <TabContainer tab="welcome" fetch={fetchWelcomeTab} slice="courseHome">
                                                    <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
                                                        <WelcomeTab />
                                                    </Suspense>
                                                </TabContainer>
                                            </DecodePageRoute>
                                        }
                                    />
                                    {/* HOME route - handles /course/:courseId/home (Khóa học tab - OUTLINE) */}
                                    <Route
                                        path={DECODE_ROUTES.HOME}
                                        element={
                                            <DecodePageRoute>
                                                <TabContainer tab="outline" fetch={fetchOutlineTab} slice="courseHome">
                                                    <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
                                                        <OutlineTab />
                                                    </Suspense>
                                                </TabContainer>
                                            </DecodePageRoute>
                                        }
                                    />
                                    {/* OUTLINE route - handles /course/:courseId/course (redirect to /home for consistency) */}
                                    <Route
                                        path={DECODE_ROUTES.OUTLINE}
                                        element={
                                            <DecodePageRoute>
                                                <CourseOutlineRedirect />
                                            </DecodePageRoute>
                                        }
                                    />
                                    <Route
                                        path={DECODE_ROUTES.LIVE}
                                        element={
                                            <DecodePageRoute>
                                                <TabContainer tab="lti_live" fetch={fetchLiveTab} slice="courseHome">
                                                    <LiveTab />
                                                </TabContainer>
                                            </DecodePageRoute>
                                        }
                                    />
                                    <Route
                                        path={DECODE_ROUTES.DATES}
                                        element={
                                            <DecodePageRoute>
                                                <TabContainer tab="dates" fetch={fetchDatesTab} slice="courseHome">
                                                    <DatesTab />
                                                </TabContainer>
                                            </DecodePageRoute>
                                        }
                                    />
                                    <Route
                                        path={DECODE_ROUTES.DISCUSSION}
                                        element={
                                            <DecodePageRoute>
                                                <TabContainer
                                                    tab="discussion"
                                                    fetch={fetchDiscussionTab}
                                                    slice="courseHome"
                                                >
                                                    <DiscussionTab />
                                                </TabContainer>
                                            </DecodePageRoute>
                                        }
                                    />
                                    <Route
                                        path={DECODE_ROUTES.TEAMS}
                                        element={
                                            <DecodePageRoute>
                                                <TabContainer
                                                    tab="teams"
                                                    fetch={fetchTeamsTab}
                                                    slice="courseHome"
                                                >
                                                    <TeamsTab />
                                                </TabContainer>
                                            </DecodePageRoute>
                                        }
                                    />
                                    <Route
                                        path={DECODE_ROUTES.STUDY_GROUPS}
                                        element={
                                            <DecodePageRoute>
                                                <TabContainer
                                                    tab="study-groups"
                                                    fetch={fetchStudyGroupsTab}
                                                    slice="courseHome"
                                                >
                                                    <StudyGroupsTab />
                                                </TabContainer>
                                            </DecodePageRoute>
                                        }
                                    />
                                    <Route
                                        path={DECODE_ROUTES.LEADERBOARD}
                                        element={
                                            <DecodePageRoute>
                                                <TabContainer
                                                    tab="leaderboard"
                                                    fetch={fetchLeaderboardTab}
                                                    slice="courseHome"
                                                >
                                                    <LeaderboardTab />
                                                </TabContainer>
                                            </DecodePageRoute>
                                        }
                                    />
                                    <Route
                                        path={DECODE_ROUTES.BADGE}
                                        element={
                                            <DecodePageRoute>
                                                <TabContainer
                                                    tab="badge"
                                                    fetch={fetchBadgeTab}
                                                    slice="courseHome"
                                                >
                                                    <BadgeTab />
                                                </TabContainer>
                                            </DecodePageRoute>
                                        }
                                    />
                                    {DECODE_ROUTES.PROGRESS.map((route) => (
                                        <Route
                                            key={route}
                                            path={route}
                                            element={
                                                <DecodePageRoute>
                                                    <TabContainer
                                                        tab="progress"
                                                        fetch={fetchProgressTab}
                                                        slice="courseHome"
                                                        isProgressTab
                                                    >
                                                        <ProgressTab />
                                                    </TabContainer>
                                                </DecodePageRoute>
                                            }
                                        />
                                    ))}
                                    <Route
                                        path={DECODE_ROUTES.COURSE_END}
                                        element={
                                            <DecodePageRoute>
                                                <TabContainer tab="courseware" fetch={fetchCourse} slice="courseware">
                                                    <CourseExit />
                                                </TabContainer>
                                            </DecodePageRoute>
                                        }
                                    />
                                    {/* COURSEWARE routes - filter out /course/:courseId to prevent conflict with redirect */}
                                    {DECODE_ROUTES.COURSEWARE.filter(route => route !== '/course/:courseId').map((route) => (
                                        <Route
                                            key={route}
                                            path={route}
                                            element={
                                                <DecodePageRoute>
                                                    <CoursewareContainer />
                                                </DecodePageRoute>
                                            }
                                        />
                                    ))}
                                    {/* Redirect from exact /course/:courseId (no additional path) to /course/:courseId/course (OUTLINE tab) */}
                                    {/* This MUST be AFTER all specific routes (OUTLINE, COURSEWARE, etc.) so specific paths match first */}
                                    {/* React Router v6 matches routes in order - more specific routes are matched first */}
                                    {/* IMPORTANT: This route will ONLY match /course/:courseId, NOT /course/:courseId/course or other sub-paths */}
                                    {/* The CourseHomeRedirect component will verify the pathname is exactly /course/:courseId before redirecting */}
                                    <Route
                                        path="/course/:courseId"
                                        element={
                                            <DecodePageRoute>
                                                <CourseHomeRedirect />
                                            </DecodePageRoute>
                                        }
                                    />
                                </Routes>
                            </TextReplacerProvider>
                        </UserMessagesProvider>
                    </NoticesProvider>
                </PathFixesProvider>
            </AppProvider>
        </StrictMode>
    );
});

subscribe(APP_INIT_ERROR, (error) => {
    const root = createRoot(document.getElementById("root"));

    root.render(
        <StrictMode>
            <ErrorPage message={error.message} />
        </StrictMode>
    );
});

initialize({
    handlers: {
        config: () => {
            mergeConfig(
                {
                    CONTACT_URL: process.env.CONTACT_URL || null,
                    CREDENTIALS_BASE_URL: process.env.CREDENTIALS_BASE_URL || null,
                    CREDIT_HELP_LINK_URL: process.env.CREDIT_HELP_LINK_URL || null,
                    DISCUSSIONS_MFE_BASE_URL: process.env.DISCUSSIONS_MFE_BASE_URL || null,
                    ENTERPRISE_LEARNER_PORTAL_HOSTNAME: process.env.ENTERPRISE_LEARNER_PORTAL_HOSTNAME || null,
                    ENABLE_JUMPNAV: process.env.ENABLE_JUMPNAV || null,
                    ENABLE_NOTICES: process.env.ENABLE_NOTICES || null,
                    INSIGHTS_BASE_URL: process.env.INSIGHTS_BASE_URL || null,
                    SEARCH_CATALOG_URL: process.env.SEARCH_CATALOG_URL || null,
                    SOCIAL_UTM_MILESTONE_CAMPAIGN: process.env.SOCIAL_UTM_MILESTONE_CAMPAIGN || null,
                    STUDIO_BASE_URL: process.env.STUDIO_BASE_URL || null,
                    SUPPORT_URL: process.env.SUPPORT_URL || null,
                    SUPPORT_URL_CALCULATOR_MATH: process.env.SUPPORT_URL_CALCULATOR_MATH || null,
                    SUPPORT_URL_ID_VERIFICATION: process.env.SUPPORT_URL_ID_VERIFICATION || null,
                    SUPPORT_URL_VERIFIED_CERTIFICATE: process.env.SUPPORT_URL_VERIFIED_CERTIFICATE || null,
                    TERMS_OF_SERVICE_URL: process.env.TERMS_OF_SERVICE_URL || null,
                    TWITTER_HASHTAG: process.env.TWITTER_HASHTAG || null,
                    TWITTER_URL: process.env.TWITTER_URL || null,
                    LEGACY_THEME_NAME: process.env.LEGACY_THEME_NAME || null,
                    EXAMS_BASE_URL: process.env.EXAMS_BASE_URL || null,
                    PROCTORED_EXAM_FAQ_URL: process.env.PROCTORED_EXAM_FAQ_URL || null,
                    PROCTORED_EXAM_RULES_URL: process.env.PROCTORED_EXAM_RULES_URL || null,
                    CHAT_RESPONSE_URL: process.env.CHAT_RESPONSE_URL || null,
                    PRIVACY_POLICY_URL: process.env.PRIVACY_POLICY_URL || null,
                    SHOW_UNGRADED_ASSIGNMENT_PROGRESS: process.env.SHOW_UNGRADED_ASSIGNMENT_PROGRESS || false,
                    ENABLE_XPERT_AUDIT: process.env.ENABLE_XPERT_AUDIT || false,
                },
                "LearnerAppConfig"
            );
        },
    },
    messages,
});
