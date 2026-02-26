import { logError } from '@edx/frontend-platform/logging';
import { camelCaseObject } from '@edx/frontend-platform';
import {
  executePostFromPostEvent,
  getCourseHomeCourseMetadata,
  getDatesTabData,
  getLeaderboardTabData,
  getOutlineTabData,
  getProgressTabData,
  postCourseDeadlines,
  deprecatedPostCourseGoals,
  postWeeklyLearningGoal,
  postDismissWelcomeMessage,
  postRequestCert,
  getLiveTabIframe,
  getCoursewareSearchEnabled,
  searchCourseContentFromAPI,
  getWelcomeTabData,
  getStudyGroupsTabData,
} from './api';

import {
  addModel, updateModel,
} from '../../generic/model-store';

import {
  fetchTabDenied,
  fetchTabFailure,
  fetchTabRequest,
  fetchTabSuccess,
  setCallToActionToast,
} from './slice';

import mapSearchResponse from '../courseware-search/map-search-response';

const eventTypes = {
  POST_EVENT: 'post_event',
};

export function fetchTab(courseId, tab, getTabData, targetUserId) {
  return async (dispatch) => {
    dispatch(fetchTabRequest({ courseId }));
    try {
      const promisesToFulfill = [getCourseHomeCourseMetadata(courseId, 'outline')];
      if (getTabData) {
        promisesToFulfill.push(getTabData(courseId, targetUserId));
      }
      const [
        courseHomeCourseMetadataResult,
        tabDataResult,
      ] = await Promise.allSettled(promisesToFulfill);
      if (courseHomeCourseMetadataResult.status === 'fulfilled') {
        dispatch(addModel({
          modelType: 'courseHomeMeta',
          model: {
            id: courseId,
            ...courseHomeCourseMetadataResult.value,
          },
        }));
      }
      if (tabDataResult?.status === 'fulfilled') {
        dispatch(addModel({
          modelType: tab,
          model: {
            id: courseId,
            ...tabDataResult.value,
          },
        }));
      }
      if (courseHomeCourseMetadataResult.status === 'rejected') {
        throw courseHomeCourseMetadataResult.reason;
      } else if (!courseHomeCourseMetadataResult.value.courseAccess.hasAccess) {
        // If the learner does not have access to the course, short cut to dispatch to a denied response regardless of
        // the tabDataResult.
        dispatch(fetchTabDenied({ courseId }));
      } else if (tabDataResult?.status === 'rejected') {
        throw tabDataResult.reason;
      } else {
        dispatch(fetchTabSuccess({
          courseId,
          targetUserId,
        }));
      }
    } catch (e) {
      dispatch(fetchTabFailure({ courseId }));
      logError(e);
    }
  };
}

export function fetchDatesTab(courseId) {
  return fetchTab(courseId, 'dates', getDatesTabData);
}

export function fetchLeaderboardTab(courseId) {
  return fetchTab(courseId, 'leaderboardTab', getLeaderboardTabData);
}

export function fetchProgressTab(courseId, targetUserId) {
  return fetchTab(courseId, 'progress', getProgressTabData, parseInt(targetUserId, 10) || targetUserId);
}

// --- Outline tab sessionStorage cache helpers ---
// Cache key: outline tab data for a courseId, valid for 5 minutes within the session.
const OUTLINE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getOutlineCacheKey(courseId) {
  return `outline_tab_cache::${courseId}`;
}

function readOutlineCache(courseId) {
  try {
    const raw = sessionStorage.getItem(getOutlineCacheKey(courseId));
    if (!raw) { return null; }
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > OUTLINE_CACHE_TTL_MS) {
      sessionStorage.removeItem(getOutlineCacheKey(courseId));
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function writeOutlineCache(courseId, metaValue, tabValue) {
  try {
    sessionStorage.setItem(
      getOutlineCacheKey(courseId),
      JSON.stringify({ ts: Date.now(), data: { metaValue, tabValue } }),
    );
  } catch {
    // sessionStorage quota exceeded or unavailable — silently skip
  }
}

export function fetchOutlineTab(courseId) {
  return async (dispatch) => {
    // Serve from cache first: populate Redux store immediately then skip the network round-trip.
    const cached = readOutlineCache(courseId);
    if (cached) {
      const { metaValue, tabValue } = cached;
      dispatch(addModel({ modelType: 'courseHomeMeta', model: { id: courseId, ...metaValue } }));
      dispatch(addModel({ modelType: 'outline', model: { id: courseId, ...tabValue } }));
      dispatch(fetchTabSuccess({ courseId }));
      return;
    }

    // No cache — do the normal network fetch and cache the result.
    dispatch(fetchTabRequest({ courseId }));
    try {
      const [courseHomeCourseMetadataResult, tabDataResult] = await Promise.allSettled([
        getCourseHomeCourseMetadata(courseId, 'outline'),
        getOutlineTabData(courseId),
      ]);

      if (courseHomeCourseMetadataResult.status === 'fulfilled') {
        dispatch(addModel({
          modelType: 'courseHomeMeta',
          model: { id: courseId, ...courseHomeCourseMetadataResult.value },
        }));
      }
      if (tabDataResult?.status === 'fulfilled') {
        dispatch(addModel({
          modelType: 'outline',
          model: { id: courseId, ...tabDataResult.value },
        }));
      }

      if (courseHomeCourseMetadataResult.status === 'rejected') {
        throw courseHomeCourseMetadataResult.reason;
      } else if (!courseHomeCourseMetadataResult.value.courseAccess.hasAccess) {
        dispatch(fetchTabDenied({ courseId }));
      } else if (tabDataResult?.status === 'rejected') {
        throw tabDataResult.reason;
      } else {
        // Persist to sessionStorage so subsequent visits (including prefetch → navigate) skip the network.
        writeOutlineCache(courseId, courseHomeCourseMetadataResult.value, tabDataResult.value);
        dispatch(fetchTabSuccess({ courseId }));
      }
    } catch (e) {
      dispatch(fetchTabFailure({ courseId }));
      logError(e);
    }
  };
}

export function fetchLiveTab(courseId) {
  return fetchTab(courseId, 'live', getLiveTabIframe);
}

export function fetchDiscussionTab(courseId) {
  return fetchTab(courseId, 'discussion');
}

export function fetchTeamsTab(courseId) {
  return fetchTab(courseId, 'teams');
}

export function fetchBadgeTab(courseId) {
  return fetchTab(courseId, 'badge');
}

export function fetchStudyGroupsTab(courseId) {
  return fetchTab(courseId, 'study-groups', getStudyGroupsTabData);
}

export function fetchWelcomeTab(courseId) {
  return fetchTab(courseId, 'welcome', getWelcomeTabData);
}

export function dismissWelcomeMessage(courseId) {
  return async () => postDismissWelcomeMessage(courseId);
}

export function requestCert(courseId) {
  return async () => postRequestCert(courseId);
}

export function resetDeadlines(courseId, model, getTabData) {
  return async (dispatch) => {
    postCourseDeadlines(courseId, model).then(response => {
      const { data } = response;
      const {
        header,
        link,
        link_text: linkText,
      } = data;
      dispatch(getTabData(courseId));
      dispatch(setCallToActionToast({ header, link, linkText }));
    });
  };
}

export async function deprecatedSaveCourseGoal(courseId, goalKey) {
  return deprecatedPostCourseGoals(courseId, goalKey);
}

export async function saveWeeklyLearningGoal(courseId, daysPerWeek, subscribedToReminders) {
  return postWeeklyLearningGoal(courseId, daysPerWeek, subscribedToReminders);
}

export function processEvent(eventData, getTabData) {
  return async (dispatch) => {
    // Pulling this out early so the data doesn't get camelCased and is easier
    // to use when it's passed to the backend
    const { research_event_data: researchEventData } = eventData;
    const event = camelCaseObject(eventData);
    if (event.eventName === eventTypes.POST_EVENT) {
      executePostFromPostEvent(event.postData, researchEventData).then(response => {
        const { data } = response;
        const {
          header,
          link,
          link_text: linkText,
        } = data;
        dispatch(getTabData(event.postData.bodyParams.courseId));
        dispatch(setCallToActionToast({ header, link, linkText }));
      });
    }
  };
}

export async function fetchCoursewareSearchSettings(courseId) {
  try {
    const { enabled } = await getCoursewareSearchEnabled(courseId);
    return { enabled };
  } catch (e) {
    return { enabled: false };
  }
}

export function searchCourseContent(courseId, searchKeyword) {
  return async (dispatch) => {
    const start = new Date();

    dispatch(addModel({
      modelType: 'contentSearchResults',
      model: {
        id: courseId,
        searchKeyword,
        results: [],
        errors: undefined,
        loading: true,
      },
    }));

    let data;
    let curatedResponse;
    let errors;
    try {
      ({ data } = await searchCourseContentFromAPI(courseId, searchKeyword));
      curatedResponse = mapSearchResponse(data, searchKeyword);
    } catch (e) {
      // TODO: Remove when publishing to prod. Just temporary for performance debugging.
      // eslint-disable-next-line no-console
      console.error('Error on Courseware Search: ', e.message);
      errors = e.message;
    }

    dispatch(updateModel({
      modelType: 'contentSearchResults',
      model: {
        ...curatedResponse,
        id: courseId,
        searchKeyword,
        errors,
        loading: false,
      },
    }));

    const end = new Date();
    const clientMs = (end - start);
    const {
      took, total, maxScore, accessDeniedCount,
    } = data;

    // TODO: Remove when publishing to prod. Just temporary for performance debugging.
    // eslint-disable-next-line no-console
    console.table({
      'Search Keyword': searchKeyword,
      'Client time (ms)': clientMs,
      'Server time (ms)': took,
      'Total matches': total,
      'Max score': maxScore,
      'Access denied count': accessDeniedCount,
    });
  };
}
