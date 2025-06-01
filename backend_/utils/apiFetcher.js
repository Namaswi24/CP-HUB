// backend/utils/apiFetcher.js
import axios from 'axios';

// Ensure CLIST_BASE_URL is correctly defined, e.g., for v4 of the API
const CLIST_BASE_URL = 'https://clist.by/api/v4';

// Prepare headers for Clist.by API authentication
const clistApiHeaders = {
  'Authorization': `ApiKey ${process.env.CLIST_USERNAME}:${process.env.CLIST_API_KEY}`
};

/**
 * Fetches upcoming contests from Clist.by.
 * @param {object} filters - Optional filters for the API request (e.g., limit, resource_id__in).
 * @returns {Promise<Array>} A promise that resolves to an array of contest objects or an empty array on error.
 */
export const fetchUpcomingContestsFromClist = async (filters = {}) => {
  try {
    const defaultParams = {
      // Default: get contests starting from now, or already started but not ended
      // Clist.by uses start__gt, start__lt, end__gt, end__lt for time filtering
      // To get "upcoming" in a broad sense (including ongoing):
      end__gt: new Date().toISOString(), // Contests that haven't ended yet
      order_by: 'start',                 // Order by start time
      limit: 100,                        // Default fetch limit
      format: 'json',                    // Response format
    };

    const params = { ...defaultParams, ...filters };

    // console.log(`[Clist.by Fetch] Requesting URL: ${CLIST_BASE_URL}/contest/`);
    // console.log(`[Clist.by Fetch] Params:`, JSON.stringify(params));
    // console.log(`[Clist.by Fetch] Headers: Authorization: ApiKey ${process.env.CLIST_USERNAME}:YOUR_API_KEY_HIDDEN_FOR_LOG`);

    const response = await axios.get(`${CLIST_BASE_URL}/contest/`, {
      headers: clistApiHeaders,
      params: params
    });

    if (response.data && response.data.objects) {
      return response.data.objects.map(contest => ({
        id: contest.id, // Clist.by specific ID for the contest
        title: contest.event,
        url: contest.href,
        platform: contest.resource.name,
        platformIcon: contest.resource.icon,
        startTime: contest.start, // ISO Date String
        endTime: contest.end,     // ISO Date String
        durationSeconds: contest.duration,
        description: null, // Clist.by contest objects don't usually have a rich description field
      }));
    } else {
      console.error('[Clist.by Fetch] Unexpected response structure:', response.data);
      return [];
    }
  } catch (error) {
    if (error.response) {
      console.error(`[Clist.by Fetch] API Error Status: ${error.response.status}`);
      console.error(`[Clist.by Fetch] API Error Data:`, error.response.data);
    } else if (error.request) {
      console.error('[Clist.by Fetch] No response received:', error.request);
    } else {
      console.error('[Clist.by Fetch] Request setup error:', error.message);
    }
    return [];
  }
};

/**
 * Fetches problems from a specified platform using its direct API or Clist.by if available.
 * @param {string} platform - The platform to fetch problems from (e.g., 'Codeforces', 'LeetCode').
 * @param {object} filters - Filters for fetching problems (e.g., tags, difficulty, limit).
 * @returns {Promise<Array>} A promise that resolves to an array of problem objects.
 */
export const fetchProblemsFromPlatform = async (platform, filters = {}) => {
  // console.log(`[Problem Fetch] Attempting to fetch for platform: ${platform} with filters:`, filters);

  if (platform.toLowerCase() === 'codeforces') {
    try {
      const params = {
        tags: filters.tags || undefined, // Expects comma-separated string
      };
      const response = await axios.get('https://codeforces.com/api/problemset.problems', { params });

      if (response.data.status === 'OK') {
        let problems = response.data.result.problems.map(p => ({
          problemId: `${p.contestId}${p.index}`,
          title: p.name,
          platform: 'Codeforces',
          difficulty: p.rating ? p.rating.toString() : undefined, // CF rating is numeric
          tags: p.tags,
          url: p.contestId ? `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}` : `https://codeforces.com/problemset`, // Fallback URL
        }));

        if (filters.difficulty && !isNaN(parseInt(filters.difficulty))) {
          const targetRating = parseInt(filters.difficulty);
          problems = problems.filter(p => p.difficulty && parseInt(p.difficulty) >= targetRating - 100 && parseInt(p.difficulty) <= targetRating + 100);
        }
        return problems.slice(0, filters.limit || 50);
      } else {
        console.error('[Problem Fetch Codeforces] API Error:', response.data.comment);
        return [];
      }
    } catch (error) {
      console.error('[Problem Fetch Codeforces] Request Error:', error.message);
      return [];
    }
  } else if (platform.toLowerCase() === 'leetcode') {
    console.warn('[Problem Fetch LeetCode] Direct API fetching for LeetCode is complex/unofficial. Returning placeholder/empty.');
    // Placeholder - real LeetCode API integration is more involved
    return [];
  }
  // TODO: Implement fetching for AtCoder, CodeChef, GeeksForGeeks
  // This will require finding their respective APIs and how to query them.
  // Some might be available via Clist.by's problemset API if it exists and is suitable.

  console.warn(`[Problem Fetch] Platform ${platform} problem fetching not implemented or no problems found.`);
  return [];
};
