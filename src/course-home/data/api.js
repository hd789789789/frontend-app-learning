import { camelCaseObject, getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { logInfo } from '@edx/frontend-platform/logging';
import { appendBrowserTimezoneToUrl } from '../../utils';

const calculateAssignmentTypeGrades = (points, assignmentWeight, numDroppable) => {
  let dropCount = numDroppable;
  // Drop the lowest grades
  while (dropCount && points.length >= dropCount) {
    const lowestScore = Math.min(...points);
    const lowestScoreIndex = points.indexOf(lowestScore);
    points.splice(lowestScoreIndex, 1);
    dropCount--;
  }
  let averageGrade = 0;
  let weightedGrade = 0;
  if (points.length) {
    // Calculate the average grade for the assignment and round it. This rounding is not ideal and does not accurately
    // reflect what a learner's grade would be, however, we must have parity with the current grading behavior that
    // exists in edx-platform.
    averageGrade = (points.reduce((a, b) => a + b, 0) / points.length).toFixed(4);
    weightedGrade = averageGrade * assignmentWeight;
  }
  return { averageGrade, weightedGrade };
};

function normalizeAssignmentPolicies(assignmentPolicies, sectionScores) {
  const gradeByAssignmentType = {};
  assignmentPolicies.forEach(assignment => {
    // Create an array with the number of total assignments and set the scores to 0
    // as placeholders for assignments that have not yet been released
    gradeByAssignmentType[assignment.type] = {
      grades: Array(assignment.numTotal).fill(0),
      numAssignmentsCreated: 0,
      numTotalExpectedAssignments: assignment.numTotal,
    };
  });

  sectionScores.forEach((chapter) => {
    chapter.subsections.forEach((subsection) => {
      if (!(subsection.hasGradedAssignment && subsection.showGrades && subsection.numPointsPossible)) {
        return;
      }
      const {
        assignmentType,
        numPointsEarned,
        numPointsPossible,
      } = subsection;

      // If a subsection's assignment type does not match an assignment policy in Studio,
      // we won't be able to include it in this accumulation of grades by assignment type.
      // This may happen if a course author has removed/renamed an assignment policy in Studio and
      // neglected to update the subsection's of that assignment type
      if (!gradeByAssignmentType[assignmentType]) {
        return;
      }

      let {
        numAssignmentsCreated,
      } = gradeByAssignmentType[assignmentType];

      numAssignmentsCreated++;
      if (numAssignmentsCreated <= gradeByAssignmentType[assignmentType].numTotalExpectedAssignments) {
        // Remove a placeholder grade so long as the number of recorded created assignments is less than the number
        // of expected assignments
        gradeByAssignmentType[assignmentType].grades.shift();
      }
      // Add the graded assignment to the list
      gradeByAssignmentType[assignmentType].grades.push(numPointsEarned ? numPointsEarned / numPointsPossible : 0);
      // Record the created assignment
      gradeByAssignmentType[assignmentType].numAssignmentsCreated = numAssignmentsCreated;
    });
  });

  return assignmentPolicies.map((assignment) => {
    const { averageGrade, weightedGrade } = calculateAssignmentTypeGrades(
      gradeByAssignmentType[assignment.type].grades,
      assignment.weight,
      assignment.numDroppable,
    );

    return {
      averageGrade,
      numDroppable: assignment.numDroppable,
      shortLabel: assignment.shortLabel,
      type: assignment.type,
      weight: assignment.weight,
      weightedGrade,
    };
  });
}

/**
 * Tweak the metadata for consistency
 * @param metadata the data to normalize
 * @param rootSlug either 'courseware' or 'outline' depending on the context
 * @returns {Object} The normalized metadata
 */
function normalizeCourseHomeCourseMetadata(metadata, rootSlug) {
  const data = camelCaseObject(metadata);
  return {
    ...data,
    tabs: data.tabs.map(tab => ({
      // The API uses "courseware" as a slug for both courseware and the outline tab.
      // If needed, we switch it to "outline" here for
      // use within the MFE to differentiate between course home and courseware.
      slug: tab.tabId === 'courseware' ? rootSlug : tab.tabId,
      title: tab.title,
      url: tab.url,
    })),
    isMasquerading: data.originalUserIsStaff && !data.isStaff,
  };
}

export function normalizeOutlineBlocks(courseId, blocks) {
  const models = {
    courses: {},
    sections: {},
    sequences: {},
  };
  Object.values(blocks).forEach(block => {
    switch (block.type) {
      case 'course':
        models.courses[block.id] = {
          id: courseId,
          title: block.display_name,
          sectionIds: block.children || [],
          hasScheduledContent: block.has_scheduled_content,
        };
        break;

      case 'chapter':
        models.sections[block.id] = {
          complete: block.complete,
          id: block.id,
          title: block.display_name,
          resumeBlock: block.resume_block,
          sequenceIds: block.children || [],
          hideFromTOC: block.hide_from_toc,
        };
        break;

      case 'sequential':
        models.sequences[block.id] = {
          complete: block.complete,
          description: block.description,
          due: block.due,
          effortActivities: block.effort_activities,
          effortTime: block.effort_time,
          icon: block.icon,
          id: block.id,
          // The presence of a URL for the sequence indicates that we want this sequence to be a clickable
          // link in the outline (even though we ignore the given url and use an internal <Link> to ourselves).
          showLink: !!block.lms_web_url,
          title: block.display_name,
          hideFromTOC: block.hide_from_toc,
          navigationDisabled: block.navigation_disabled,
        };
        break;

      default:
        logInfo(`Unexpected course block type: ${block.type} with ID ${block.id}.  Expected block types are course, chapter, and sequential.`);
    }
  });

  // Next go through each list and use their child lists to decorate those children with a
  // reference back to their parent.
  Object.values(models.courses).forEach(course => {
    if (Array.isArray(course.sectionIds)) {
      course.sectionIds.forEach(sectionId => {
        const section = models.sections[sectionId];
        section.courseId = course.id;
      });
    }
  });

  Object.values(models.sections).forEach(section => {
    if (Array.isArray(section.sequenceIds)) {
      section.sequenceIds.forEach(sequenceId => {
        if (sequenceId in models.sequences) {
          models.sequences[sequenceId].sectionId = section.id;
        } else {
          logInfo(`Section ${section.id} has child block ${sequenceId}, but that block is not in the list of sequences.`);
        }
      });
    }
  });

  return models;
}

export async function getCourseHomeCourseMetadata(courseId, rootSlug) {
  let url = `${getConfig().LMS_BASE_URL}/api/course_home/course_metadata/${courseId}`;
  url = appendBrowserTimezoneToUrl(url);
  const { data } = await getAuthenticatedHttpClient().get(url);
  return normalizeCourseHomeCourseMetadata(data, rootSlug);
}

// For debugging purposes, you might like to see a fully loaded dates tab.
// Just uncomment the next few lines and the immediate 'return' in the function below
// import { Factory } from 'rosie';
// import './__factories__';
export async function getDatesTabData(courseId) {
  // return camelCaseObject(Factory.build('datesTabData'));
  const url = `${getConfig().LMS_BASE_URL}/api/course_home/dates/${courseId}`;
  try {
    const { data } = await getAuthenticatedHttpClient().get(url);
    return camelCaseObject(data);
  } catch (error) {
    const httpErrorStatus = error?.response?.status;
    if (httpErrorStatus === 401) {
      // The backend sends this for unenrolled and unauthenticated learners, but we handle those cases by examining
      // courseAccess in the metadata call, so just ignore this status for now.
      return {};
    }
    if (httpErrorStatus === 403) {
      // The backend sends this if there is a course access error and the user should be redirected. The redirect
      // info is included in the course metadata request and will be handled there as long as this call returns
      // without an error
      return {};
    }
    throw error;
  }
}

export async function getLeaderboardTabData(courseId) {
  const url = `${getConfig().LMS_BASE_URL}/api/course_home/leaderboard/${courseId}`;
  try {
    const { data } = await getAuthenticatedHttpClient().get(url);
    console.log('[Leaderboard API] Raw response:', data);
    const camelCased = camelCaseObject(data);
    console.log('[Leaderboard API] After camelCase:', camelCased);
    return camelCased;
  } catch (error) {
    const httpErrorStatus = error?.response?.status;
    if (httpErrorStatus === 401) {
      // The backend sends this for unenrolled and unauthenticated learners, but we handle those cases by examining
      // courseAccess in the metadata call, so just ignore this status for now.
      return {};
    }
    if (httpErrorStatus === 403) {
      // The backend sends this if there is a course access error and the user should be redirected. The redirect
      // info is included in the course metadata request and will be handled there as long as this call returns
      // without an error
      return {};
    }
    throw error;
  }
}

// API lấy Top Students theo điểm số (Grades)
export async function getTopGradesLeaderboard(courseId, limit = 10) {
  // Sử dụng API mới: /api/course_home/top-grades/{courseId}
  const url = `${getConfig().LMS_BASE_URL}/api/course_home/top-grades/${courseId}?limit=${limit}`;
  try {
    const { data } = await getAuthenticatedHttpClient().get(url);
    console.log('[Top Grades API] Raw response:', data);
    const camelCased = camelCaseObject(data);
    console.log('[Top Grades API] After camelCase:', camelCased);
    return camelCased;
  } catch (error) {
    console.error('[Top Grades API] Error:', error);
    const httpErrorStatus = error?.response?.status;
    if (httpErrorStatus === 401 || httpErrorStatus === 403) {
      return { success: false, topStudents: [], summary: {} };
    }
    throw error;
  }
}

// API lấy Top Students theo tiến độ (Progress)
export async function getTopProgressLeaderboard(courseId, period = 'all', limit = 10) {
  // Sử dụng API mới: /api/course_home/top-progress/{courseId}
  const url = `${getConfig().LMS_BASE_URL}/api/course_home/top-progress/${courseId}?period=${period}&limit=${limit}`;
  try {
    const { data } = await getAuthenticatedHttpClient().get(url);
    console.log('[Top Progress API] Raw response:', data);
    const camelCased = camelCaseObject(data);
    console.log('[Top Progress API] After camelCase:', camelCased);
    return camelCased;
  } catch (error) {
    console.error('[Top Progress API] Error:', error);
    const httpErrorStatus = error?.response?.status;
    if (httpErrorStatus === 401 || httpErrorStatus === 403) {
      return { success: false, topStudents: [], summary: {} };
    }
    throw error;
  }
}

export async function getProgressTabData(courseId, targetUserId) {
  let url = `${getConfig().LMS_BASE_URL}/api/course_home/progress/${courseId}`;

  // If targetUserId is passed in, we will get the progress page data
  // for the user with the provided id, rather than the requesting user.
  if (targetUserId) {
    url += `/${targetUserId}/`;
  }

  try {
    const { data } = await getAuthenticatedHttpClient().get(url);
    const camelCasedData = camelCaseObject(data);

    camelCasedData.gradingPolicy.assignmentPolicies = normalizeAssignmentPolicies(
      camelCasedData.gradingPolicy.assignmentPolicies,
      camelCasedData.sectionScores,
    );

    // We replace gradingPolicy.gradeRange with the original data to preserve the intended casing for the grade.
    // For example, if a grade range key is "A", we do not want it to be camel cased (i.e. "A" would become "a")
    // in order to preserve a course team's desired grade formatting.
    camelCasedData.gradingPolicy.gradeRange = data.grading_policy.grade_range;

    camelCasedData.gradesFeatureIsFullyLocked = camelCasedData.completionSummary.lockedCount > 0;

    camelCasedData.gradesFeatureIsPartiallyLocked = false;
    if (camelCasedData.gradesFeatureIsFullyLocked) {
      camelCasedData.sectionScores.forEach((chapter) => {
        chapter.subsections.forEach((subsection) => {
          // If something is eligible to be gated by content type gating and would show up on the progress page
          if (subsection.assignmentType !== null && subsection.hasGradedAssignment && subsection.showGrades
            && (subsection.numPointsPossible > 0 || subsection.numPointsEarned > 0)) {
            // but the learner still has access to it, then we are in a partially locked, rather than fully locked state
            // since the learner has access to some (but not all) content that would normally be locked
            if (subsection.learnerHasAccess) {
              camelCasedData.gradesFeatureIsPartiallyLocked = true;
              camelCasedData.gradesFeatureIsFullyLocked = false;
            }
          }
        });
      });
    }

    return camelCasedData;
  } catch (error) {
    const httpErrorStatus = error?.response?.status;
    if (httpErrorStatus === 404) {
      global.location.replace(`${getConfig().LMS_BASE_URL}/courses/${courseId}/progress`);
      return {};
    }
    if (httpErrorStatus === 401) {
      // The backend sends this for unenrolled and unauthenticated learners, but we handle those cases by examining
      // courseAccess in the metadata call, so just ignore this status for now.
      return {};
    }
    if (httpErrorStatus === 403) {
      // The backend sends this if there is a course access error and the user should be redirected. The redirect
      // info is included in the course metadata request and will be handled there as long as this call returns
      // without an error
      return {};
    }
    throw error;
  }
}

export async function getProctoringInfoData(courseId, username) {
  let url;
  if (!getConfig().EXAMS_BASE_URL) {
    url = `${getConfig().LMS_BASE_URL}/api/edx_proctoring/v1/user_onboarding/status?is_learning_mfe=true&course_id=${encodeURIComponent(courseId)}`;
    if (username) {
      url += `&username=${encodeURIComponent(username)}`;
    }
  } else {
    url = `${getConfig().EXAMS_BASE_URL}/api/v1/student/course_id/${encodeURIComponent(courseId)}/onboarding`;
    if (username) {
      url += `?username=${encodeURIComponent(username)}`;
    }
  }
  try {
    const { data } = await getAuthenticatedHttpClient().get(url);
    return data;
  } catch (error) {
    const { httpErrorStatus } = error && error.customAttributes;
    if (httpErrorStatus === 404) {
      return {};
    }
    throw error;
  }
}

export async function getLiveTabIframe(courseId) {
  const url = `${getConfig().LMS_BASE_URL}/api/course_live/iframe/${courseId}/`;
  try {
    const { data } = await getAuthenticatedHttpClient().get(url);
    return data;
  } catch (error) {
    const { httpErrorStatus } = error && error.customAttributes;
    if (httpErrorStatus === 404) {
      return {};
    }
    throw error;
  }
}

export function getTimeOffsetMillis(headerDate, requestTime, responseTime) {
  // Time offset computation should move down into the HttpClient wrapper to maintain a global time correction reference
  // Requires 'Access-Control-Expose-Headers: Date' on the server response per https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#access-control-expose-headers

  let timeOffsetMillis = 0;
  if (headerDate !== undefined) {
    const headerTime = Date.parse(headerDate);
    const roundTripMillis = requestTime - responseTime;
    const localTime = responseTime - (roundTripMillis / 2); // Roughly compensate for transit time
    timeOffsetMillis = headerTime - localTime;
  }

  return timeOffsetMillis;
}

export async function getOutlineTabData(courseId) {
  const url = `${getConfig().LMS_BASE_URL}/api/course_home/outline/${courseId}`;
  const requestTime = Date.now();
  let tabData;
  try {
    tabData = await getAuthenticatedHttpClient().get(url);
  } catch (error) {
    const httpErrorStatus = error?.response?.status;
    if (httpErrorStatus === 403) {
      // The backend sends this if there is a course access error and the user should be redirected. The redirect
      // info is included in the course metadata request and will be handled there as long as this call returns
      // without an error
      return {};
    }
    throw error;
  }

  const responseTime = Date.now();

  const {
    data,
    headers,
  } = tabData;

  const accessExpiration = camelCaseObject(data.access_expiration);
  const certData = camelCaseObject(data.cert_data);
  const courseBlocks = data.course_blocks ? normalizeOutlineBlocks(courseId, data.course_blocks.blocks) : {};
  const courseGoals = camelCaseObject(data.course_goals);
  const courseTools = camelCaseObject(data.course_tools);
  const datesBannerInfo = camelCaseObject(data.dates_banner_info);
  const datesWidget = camelCaseObject(data.dates_widget);
  const enableProctoredExams = data.enable_proctored_exams;
  const enrollAlert = camelCaseObject(data.enroll_alert);
  const enrollmentMode = data.enrollment_mode;
  const handoutsHtml = data.handouts_html;
  const hasScheduledContent = data.has_scheduled_content;
  const hasEnded = data.has_ended;
  const offer = camelCaseObject(data.offer);
  const resumeCourse = camelCaseObject(data.resume_course);
  const timeOffsetMillis = getTimeOffsetMillis(headers && headers.date, requestTime, responseTime);
  const userHasPassingGrade = data.user_has_passing_grade;
  const verifiedMode = camelCaseObject(data.verified_mode);
  const welcomeMessageHtml = data.welcome_message_html || '';

  return {
    accessExpiration,
    certData,
    courseBlocks,
    courseGoals,
    courseTools,
    datesBannerInfo,
    datesWidget,
    enrollAlert,
    enrollmentMode,
    enableProctoredExams,
    handoutsHtml,
    hasScheduledContent,
    hasEnded,
    offer,
    resumeCourse,
    timeOffsetMillis, // This should move to a global time correction reference
    userHasPassingGrade,
    verifiedMode,
    welcomeMessageHtml,
  };
}

export async function postCourseDeadlines(courseId, model) {
  const url = new URL(`${getConfig().LMS_BASE_URL}/api/course_experience/v1/reset_course_deadlines`);
  return getAuthenticatedHttpClient().post(url.href, {
    course_key: courseId,
    research_event_data: { location: `${model}-tab` },
  });
}

export async function deprecatedPostCourseGoals(courseId, goalKey) {
  const url = new URL(`${getConfig().LMS_BASE_URL}/api/course_home/save_course_goal`);
  return getAuthenticatedHttpClient().post(url.href, { course_id: courseId, goal_key: goalKey });
}

export async function postWeeklyLearningGoal(courseId, daysPerWeek, subscribedToReminders) {
  const url = new URL(`${getConfig().LMS_BASE_URL}/api/course_home/save_course_goal`);
  return getAuthenticatedHttpClient().post(url.href, {
    course_id: courseId,
    days_per_week: daysPerWeek,
    subscribed_to_reminders: subscribedToReminders,
  });
}

export async function postDismissWelcomeMessage(courseId) {
  const url = new URL(`${getConfig().LMS_BASE_URL}/api/course_home/dismiss_welcome_message`);
  await getAuthenticatedHttpClient().post(url.href, { course_id: courseId });
}

export async function postRequestCert(courseId) {
  const url = new URL(`${getConfig().LMS_BASE_URL}/courses/${courseId}/generate_user_cert`);
  await getAuthenticatedHttpClient().post(url.href);
}

export async function executePostFromPostEvent(postData, researchEventData) {
  const url = new URL(postData.url);
  return getAuthenticatedHttpClient().post(url.href, {
    course_key: postData.bodyParams.courseId,
    research_event_data: researchEventData,
  });
}

export async function unsubscribeFromCourseGoal(token) {
  const url = new URL(`${getConfig().LMS_BASE_URL}/api/course_home/unsubscribe_from_course_goal/${token}`);
  return getAuthenticatedHttpClient().post(url.href)
    .then(res => camelCaseObject(res));
}

export async function getCoursewareSearchEnabled(courseId) {
  const url = new URL(`${getConfig().LMS_BASE_URL}/courses/${courseId}/courseware-search/enabled/`);
  const { data } = await getAuthenticatedHttpClient().get(url.href);
  return { enabled: data.enabled || false };
}

export async function searchCourseContentFromAPI(courseId, searchKeyword, options = {}) {
  const defaults = { page: 0, limit: 20 };
  const { page, limit } = { ...defaults, ...options };

  const url = new URL(`${getConfig().LMS_BASE_URL}/search/${courseId}`);
  const formData = `search_string=${searchKeyword}&page_size=${limit}&page_index=${page}`;
  const response = await getAuthenticatedHttpClient().post(url.href, formData);

  return camelCaseObject(response);
}

export async function getWelcomeTabData(courseId) {
  const url = `${getConfig().LMS_BASE_URL}/api/course_home/welcome/${courseId}`;
  try {
    const { data } = await getAuthenticatedHttpClient().get(url);
    return camelCaseObject(data);
  } catch (error) {
    const httpErrorStatus = error?.response?.status;
    if (httpErrorStatus === 401 || httpErrorStatus === 403) {
      return {
        success: false, userStats: {}, importantDates: [], dailyQuests: [],
      };
    }
    if (httpErrorStatus === 404) {
      // API might not be deployed yet, return empty data
      return {
        success: false, userStats: {}, importantDates: [], dailyQuests: [],
      };
    }
    throw error;
  }
}

export async function getStudyGroupsTabData(courseId) {
  const url = `${getConfig().LMS_BASE_URL}/api/study-groups/courses/${encodeURIComponent(courseId)}/study-groups/`;

  try {
    const { data } = await getAuthenticatedHttpClient().get(url);
    const camelCased = camelCaseObject(data);
    return camelCased;
  } catch (error) {
    const httpErrorStatus = error?.response?.status;
    console.error('[Study Groups API] Error fetching groups:', {
      courseId,
      url,
      status: httpErrorStatus,
      error: error.response?.data,
      message: error.message,
    });

    if (httpErrorStatus === 401 || httpErrorStatus === 403) {
      return { success: false, results: [], count: 0 };
    }
    if (httpErrorStatus === 404) {
      // API might not be deployed yet, return empty data
      return { success: false, results: [], count: 0 };
    }
    throw error;
  }
}

// Study Groups API functions
export async function createStudyGroup(courseId, groupData) {
  const url = `${getConfig().LMS_BASE_URL}/api/study-groups/courses/${encodeURIComponent(courseId)}/study-groups/`;

  // Backend requires course_id in the request body
  const requestData = {
    ...groupData,
    course_id: courseId,
  };

  try {
    const { data } = await getAuthenticatedHttpClient().post(url, requestData);
    return camelCaseObject(data);
  } catch (error) {
    console.error('[Study Groups API] Error creating group:', {
      courseId,
      groupData: requestData,
      url,
      status: error.response?.status,
      error: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

export async function updateStudyGroup(groupId, groupData) {
  const url = `${getConfig().LMS_BASE_URL}/api/study-groups/study-groups/${groupId}/`;

  try {
    const { data } = await getAuthenticatedHttpClient().put(url, groupData);
    return camelCaseObject(data);
  } catch (error) {
    console.error('[Study Groups API] Error updating group:', {
      groupId,
      groupData,
      url,
      status: error.response?.status,
      error: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

export async function deleteStudyGroup(groupId) {
  const url = `${getConfig().LMS_BASE_URL}/api/study-groups/study-groups/${groupId}/`;

  try {
    await getAuthenticatedHttpClient().delete(url);
    return { success: true };
  } catch (error) {
    console.error('[Study Groups API] Error deleting group:', {
      groupId,
      url,
      status: error.response?.status,
      error: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

export async function getStudyGroupDetails(groupId) {
  const url = `${getConfig().LMS_BASE_URL}/api/study-groups/study-groups/${groupId}/`;

  try {
    const { data } = await getAuthenticatedHttpClient().get(url);
    return camelCaseObject(data);
  } catch (error) {
    console.error('[Study Groups API] Error getting group details:', {
      groupId,
      url,
      status: error.response?.status,
      error: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

export async function getStudyGroupMembers(groupId) {
  const url = `${getConfig().LMS_BASE_URL}/api/study-groups/study-groups/${groupId}/members/`;

  try {
    const { data } = await getAuthenticatedHttpClient().get(url);
    return camelCaseObject(data);
  } catch (error) {
    console.error('[Study Groups API] Error getting group members:', {
      groupId,
      url,
      status: error.response?.status,
      error: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

// Helper function to find user by username or email
export async function findUserByUsernameOrEmail(usernameOrEmail) {
  // Try to get user info from accounts API
  const url = `${getConfig().LMS_BASE_URL}/api/user/v1/accounts/${encodeURIComponent(usernameOrEmail)}/`;
  try {
    const { data } = await getAuthenticatedHttpClient().get(url);
    return camelCaseObject(data);
  } catch (error) {
    // If not found by username, might be email - backend should handle this
    throw error;
  }
}

export async function addStudyGroupMember(groupId, usernameOrEmail) {
  const url = `${getConfig().LMS_BASE_URL}/api/study-groups/study-groups/${groupId}/members/`;

  try {
    // Backend StudyGroupMemberCreateSerializer accepts username or email in 'user' field
    // It will automatically find the user by username or email
    const { data } = await getAuthenticatedHttpClient().post(url, { user: usernameOrEmail });
    return camelCaseObject(data);
  } catch (error) {
    console.error('[Study Groups API] Error adding member:', {
      groupId,
      usernameOrEmail,
      url,
      status: error.response?.status,
      error: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

export async function removeStudyGroupMember(groupId, userId) {
  // Backend expects user_id (int) in path
  const url = `${getConfig().LMS_BASE_URL}/api/study-groups/study-groups/${groupId}/members/${userId}/`;

  try {
    await getAuthenticatedHttpClient().delete(url);
    return { success: true };
  } catch (error) {
    console.error('[Study Groups API] Error removing member:', {
      groupId,
      userId,
      url,
      status: error.response?.status,
      error: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

export async function getAvailableMembers(groupId, { search = '', page = 1, pageSize = 5 } = {}) {
  const params = new URLSearchParams();
  if (search) { params.append('search', search); }
  if (page) { params.append('page', page); }
  if (pageSize) { params.append('page_size', pageSize); }

  const url = `${getConfig().LMS_BASE_URL}/api/study-groups/study-groups/${groupId}/available-members/?${params.toString()}`;

  try {
    const { data } = await getAuthenticatedHttpClient().get(url);
    return camelCaseObject(data);
  } catch (error) {
    console.error('[Study Groups API] Error getting available members:', {
      groupId,
      search,
      page,
      pageSize,
      url,
      status: error.response?.status,
      error: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

export async function getGroupStreaks(courseId) {
  const url = `${getConfig().LMS_BASE_URL}/api/study-groups/courses/${courseId}/study-groups/streaks/`;

  try {
    const { data } = await getAuthenticatedHttpClient().get(url);
    return camelCaseObject(data);
  } catch (error) {
    console.error('[Study Groups API] Error getting group streaks:', {
      courseId,
      url,
      status: error.response?.status,
      error: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

export async function getStudyGroupComments(groupId) {
  const url = `${getConfig().LMS_BASE_URL}/api/study-groups/study-groups/${groupId}/comments/`;

  try {
    const { data } = await getAuthenticatedHttpClient().get(url);

    const camelCased = camelCaseObject(data);
    return camelCased;
  } catch (error) {
    console.error('[Study Groups API] Error getting group comments:', {
      groupId,
      url,
      status: error.response?.status,
      error: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

export async function createComment(groupId, commentData) {
  const url = `${getConfig().LMS_BASE_URL}/api/study-groups/study-groups/${groupId}/comments/`;

  try {
    const { data } = await getAuthenticatedHttpClient().post(url, commentData);
    return camelCaseObject(data);
  } catch (error) {
    console.error('[Study Groups API] Error creating comment:', {
      groupId,
      commentData,
      url,
      status: error.response?.status,
      error: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

export async function getCommentDetail(commentId) {
  const url = `${getConfig().LMS_BASE_URL}/api/study-groups/comments/${commentId}/`;

  try {
    const { data } = await getAuthenticatedHttpClient().get(url);
    return camelCaseObject(data);
  } catch (error) {
    console.error('[Study Groups API] Error getting comment detail:', {
      commentId,
      url,
      status: error.response?.status,
      error: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

export async function updateComment(commentId, content) {
  const url = `${getConfig().LMS_BASE_URL}/api/study-groups/comments/${commentId}/`;

  try {
    const { data } = await getAuthenticatedHttpClient().put(url, { content });
    return camelCaseObject(data);
  } catch (error) {
    console.error('[Study Groups API] Error updating comment:', {
      commentId,
      url,
      status: error.response?.status,
      error: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

export async function deleteComment(commentId) {
  const url = `${getConfig().LMS_BASE_URL}/api/study-groups/comments/${commentId}/`;

  try {
    await getAuthenticatedHttpClient().delete(url);
    return { success: true };
  } catch (error) {
    console.error('[Study Groups API] Error deleting comment:', {
      commentId,
      url,
      status: error.response?.status,
      error: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

export async function addReaction(commentId, reactionType) {
  const url = `${getConfig().LMS_BASE_URL}/api/study-groups/comments/${commentId}/reactions/`;

  try {
    const { data } = await getAuthenticatedHttpClient().post(url, { reaction_type: reactionType });
    return camelCaseObject(data);
  } catch (error) {
    console.error('[Study Groups API] Error adding reaction:', {
      commentId,
      reactionType,
      url,
      status: error.response?.status,
      error: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

export async function removeReaction(commentId) {
  const url = `${getConfig().LMS_BASE_URL}/api/study-groups/comments/${commentId}/reactions/`;

  try {
    await getAuthenticatedHttpClient().delete(url);
    return { success: true };
  } catch (error) {
    console.error('[Study Groups API] Error removing reaction:', {
      commentId,
      url,
      status: error.response?.status,
      error: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

export async function uploadCommentAttachment(commentId, file) {
  const url = `${getConfig().LMS_BASE_URL}/api/study-groups/comments/${commentId}/attachments/`;

  try {
    const formData = new FormData();
    // Append with filename to help Django build correct name
    formData.append('file', file, file?.name || 'attachment');
    const { data } = await getAuthenticatedHttpClient().post(
      url,
      formData,
      {
        // Let the browser/axios set the correct multipart boundary for FormData
        headers: {
          Accept: 'application/json',
          'Content-Type': undefined,
        },
        withCredentials: true,
        // Prevent any default JSON transforms that would strip the file
        transformRequest: [(requestData) => requestData],
      },
    );
    return camelCaseObject(data);
  } catch (error) {
    console.error('[Study Groups API] Error uploading attachment:', {
      commentId,
      fileName: file.name,
      url,
      status: error.response?.status,
      error: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}
