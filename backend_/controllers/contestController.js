// backend/controllers/contestController.js
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose'; // Needed for ObjectId.isValid
import Contest from '../models/user.js';
import { fetchUpcomingContestsFromClist } from '../utils/apiFetcher.js';

const CACHE_DURATION_MINUTES = 60; // How long to consider DB cache fresh

// @desc    Get all upcoming or ongoing contests (from cache or API)
// @route   GET /api/contests
// @access  Public
const getContests = asyncHandler(async (req, res) => {
  const { platform, showPast = 'false', limit = 100, page = 1, forceRefresh = 'false' } = req.query;
  const shouldShowPast = showPast === 'true';
  const queryLimit = Math.min(parseInt(limit, 10) || 100, 200); // Max limit 200
  const skipAmount = (Math.max(parseInt(page, 10) || 1, 1) - 1) * queryLimit;
  const shouldForceRefresh = forceRefresh === 'true';

  const dbQuery = {};
  if (!shouldShowPast) {
    dbQuery.endTime = { $gte: new Date() };
  }
  if (platform) {
    dbQuery.platform = { $regex: new RegExp(`^${platform}$`, 'i') }; // Case-insensitive exact match
  }

  let contestsFromDB = await Contest.find(dbQuery)
    .sort({ startTime: shouldShowPast ? -1 : 1 })
    .skip(skipAmount)
    .limit(queryLimit)
    .lean();

  const now = new Date();
  const isCacheConsideredStale = !contestsFromDB.length || contestsFromDB.some(c =>
    c.apiSource === 'clist.by' &&
    (!c.lastFetchedFromApiAt || (now - new Date(c.lastFetchedFromApiAt)) / (1000 * 60) > CACHE_DURATION_MINUTES)
  );

  if ((shouldForceRefresh || (!contestsFromDB.length && !shouldShowPast) || (isCacheConsideredStale && !shouldShowPast))) {
    console.log('[ContestCtrl] Cache miss, stale, or forced refresh. Fetching from Clist.by...');
    const apiContests = await fetchUpcomingContestsFromClist({
      limit: 200 // Fetch a decent batch for potential caching
      // Add resource_id__in filter here if platform is passed and you have a mapping
    });

    if (apiContests && apiContests.length > 0) {
      const operations = apiContests.map(apiContest => {
        const contestDataFromApi = {
          title: apiContest.title,
          platform: apiContest.platform,
          platformIcon: apiContest.platformIcon,
          startTime: new Date(apiContest.startTime),
          endTime: new Date(apiContest.endTime),
          durationSeconds: apiContest.durationSeconds,
          url: apiContest.url,
          description: apiContest.description || '',
          apiSource: 'clist.by',
          lastFetchedFromApiAt: new Date(),
          clistId: apiContest.id, // Ensure clistId is part of the data
        };
        return {
          updateOne: {
            filter: { clistId: apiContest.id }, // Use clistId as the unique identifier
            update: { $set: contestDataFromApi },
            upsert: true,
          },
        };
      });
      try {
        await Contest.bulkWrite(operations);
        console.log(`[ContestCtrl] Synced/Updated ${apiContests.length} contests from Clist.by with DB.`);
      } catch (bulkWriteError) {
        console.error("[ContestCtrl] Error during bulkWrite:", bulkWriteError);
      }


      // Re-fetch from DB to apply user's query, pagination, and sorting correctly
      contestsFromDB = await Contest.find(dbQuery)
        .sort({ startTime: shouldShowPast ? -1 : 1 })
        .skip(skipAmount)
        .limit(queryLimit)
        .lean();
    }
  }
  const totalContests = await Contest.countDocuments(dbQuery);

  res.status(200).json({
    contests: contestsFromDB,
    currentPage: Math.max(parseInt(page, 10) || 1, 1),
    totalPages: Math.ceil(totalContests / queryLimit),
    totalContests
  });
});

// @desc    Sync contests from Clist.by with the local database (Admin action)
// @route   POST /api/contests/sync
// @access  Admin (needs admin protection middleware)
const syncContestsWithClist = asyncHandler(async (req, res) => {
  console.log('[ContestCtrl] Admin sync initiated with Clist.by...');
  const apiContests = await fetchUpcomingContestsFromClist({ limit: 250 }); // Fetch a larger batch for sync

  if (apiContests && apiContests.length > 0) {
    const operations = apiContests.map(apiContest => {
      const contestDataFromApi = {
        title: apiContest.title,
        platform: apiContest.platform,
        platformIcon: apiContest.platformIcon,
        startTime: new Date(apiContest.startTime),
        endTime: new Date(apiContest.endTime),
        durationSeconds: apiContest.durationSeconds,
        url: apiContest.url,
        description: apiContest.description || '',
        apiSource: 'clist.by',
        lastFetchedFromApiAt: new Date(),
        clistId: apiContest.id,
      };
      return {
        updateOne: {
          filter: { clistId: apiContest.id },
          update: { $set: contestDataFromApi },
          upsert: true,
        },
      };
    });
    const result = await Contest.bulkWrite(operations);
    const message = `Sync completed. Matched: ${result.matchedCount}, Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}.`;
    console.log(`[ContestCtrl] ${message}`);
    res.status(200).json({ message, details: result });
  } else {
    const message = 'No new contests fetched from Clist.by or API error during sync.';
    console.log(`[ContestCtrl] ${message}`);
    res.status(200).json({ message });
  }
});

// @desc    Create a new contest manually (Admin)
// @route   POST /api/contests
// @access  Admin
const createManualContest = asyncHandler(async (req, res) => {
  const { title, platform, startTime, endTime, url, description, platformIcon, clistId } = req.body;

  if (!title || !platform || !startTime || !endTime || !url) {
    res.status(400);
    throw new Error('Please provide title, platform, start time, end time, and URL');
  }

  // Check if clistId is provided and unique if so
  if (clistId) {
    const existingContest = await Contest.findOne({ clistId });
    if (existingContest) {
        res.status(400);
        throw new Error(`Contest with Clist ID ${clistId} already exists.`);
    }
  }

  const contest = new Contest({
    title,
    platform,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    durationSeconds: (new Date(endTime) - new Date(startTime)) / 1000,
    url,
    description,
    platformIcon,
    clistId: clistId || null, // Store clistId if provided
    apiSource: 'manual',
  });

  const createdContest = await contest.save();
  res.status(201).json(createdContest);
});

// @desc    Get a specific contest by its MongoDB ID
// @route   GET /api/contests/:id
// @access  Public
const getContestByMongoId = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400); throw new Error('Invalid Contest ID format');
  }
  const contest = await Contest.findById(req.params.id).lean();
  if (contest) {
    res.status(200).json(contest);
  } else {
    res.status(404); throw new Error('Contest not found');
  }
});

// @desc    Update a contest by its MongoDB ID (Admin)
// @route   PUT /api/contests/:id
// @access  Admin
const updateManualContest = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400); throw new Error('Invalid Contest ID format');
  }
  const contest = await Contest.findById(req.params.id);

  if (contest) {
    // Update fields from req.body
    const updatableFields = ['title', 'platform', 'platformIcon', 'url', 'description', 'clistId'];
    updatableFields.forEach(field => {
        if (req.body[field] !== undefined) contest[field] = req.body[field];
    });
    if (req.body.startTime) contest.startTime = new Date(req.body.startTime);
    if (req.body.endTime) contest.endTime = new Date(req.body.endTime);

    // Recalculate duration if start or end time changed
    if (req.body.startTime || req.body.endTime) {
        contest.durationSeconds = (contest.endTime - contest.startTime) / 1000;
    } else if (req.body.durationSeconds !== undefined) {
        contest.durationSeconds = req.body.durationSeconds;
    }

    const updatedContest = await contest.save();
    res.status(200).json(updatedContest);
  } else {
    res.status(404); throw new Error('Contest not found for update');
  }
});

// @desc    Delete a contest by its MongoDB ID (Admin)
// @route   DELETE /api/contests/:id
// @access  Admin
const deleteManualContest = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400); throw new Error('Invalid Contest ID format');
  }
  const contest = await Contest.findById(req.params.id);
  if (contest) {
    await contest.deleteOne();
    res.status(200).json({ message: 'Contest removed successfully' });
  } else {
    res.status(404); throw new Error('Contest not found for deletion');
  }
});

export {
  getContests,
  syncContestsWithClist,
  createManualContest,
  getContestByMongoId,
  updateManualContest,
  deleteManualContest,
};
