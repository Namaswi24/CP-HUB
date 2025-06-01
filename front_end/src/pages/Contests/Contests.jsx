import React, { useEffect, useState } from 'react';
import { fetchContestsAPI, addContestToFavoritesAPI, removeContestFromFavoritesAPI, fetchFavoriteContestsAPI } from '../../api/apiService'; // Using our backend API service
import ContestCard from '../../components/ContestCard/ContestCard';
import { CalendarDays, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import './Contests.css'; // Your CSS file

const ContestsPage = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoriteContestIdentifiers, setFavoriteContestIdentifiers] = useState(new Set());
  const { userInfo } = useAuth();

  const loadContests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchContestsAPI({ limit: 50 }); // Fetch via backend
      setContests(response.data.contests || []); // Assuming backend returns { contests: [...] }
    } catch (err) {
      console.error('Error fetching contests:', err);
      setError(err.response?.data?.message || 'Failed to fetch contests. Please try again.');
      setContests([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFavoriteContests = async () => {
    if (!userInfo) return;
    try {
      const response = await fetchFavoriteContestsAPI();
      // Assuming favorite contests are stored with 'clistId' or '_id' (mongoId)
      const identifiers = new Set(response.data.map(fav => fav.clistId || fav._id));
      setFavoriteContestIdentifiers(identifiers);
    } catch (err) {
      console.error("Failed to load favorite contests:", err);
      // Optionally set an error state for favorites
    }
  };

  useEffect(() => {
    loadContests();
  }, []);

  useEffect(() => {
    if (userInfo) {
      loadFavoriteContests();
    } else {
      setFavoriteContestIdentifiers(new Set()); // Clear favorites if user logs out
    }
  }, [userInfo]);


  const handleFavoriteToggle = async (contest) => {
    if (!userInfo) {
      alert("Please log in to manage favorites."); // Or redirect, or show modal
      return;
    }
    // Use clistId if available (from Clist.by), otherwise MongoDB _id for manually added ones
    const identifier = contest.clistId || contest._id;
    if (!identifier) {
        console.error("Contest has no identifiable ID for favoriting:", contest);
        alert("Cannot favorite this contest: missing unique identifier.");
        return;
    }

    try {
      if (favoriteContestIdentifiers.has(identifier)) {
        await removeContestFromFavoritesAPI(identifier);
        setFavoriteContestIdentifiers(prev => {
          const newSet = new Set(prev);
          newSet.delete(identifier);
          return newSet;
        });
      } else {
        // When adding, send necessary contest details for backend to store in User's favorites
        await addContestToFavoritesAPI({
          clistId: contest.clistId, // Or null if not from clist
          mongoId: contest._id, // If it's a contest from our DB (e.g. manual or cached)
          title: contest.title,
          platform: contest.platform,
          startTime: contest.startTime,
          url: contest.url,
        });
        setFavoriteContestIdentifiers(prev => new Set(prev).add(identifier));
      }
    } catch (err) {
      console.error("Error toggling favorite contest:", err);
      alert(err.response?.data?.message || "Could not update favorite status.");
    }
  };


  const pageVariants = {
    initial: { opacity: 0 },
    in: { opacity: 1 },
    out: { opacity: 0 },
  };
  const listVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  return (
    <motion.div
      className="contests-page-main container"
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      transition={{ duration: 0.3 }}
    >
      <h1 className="page-title"><CalendarDays size={32} /> Upcoming Contests</h1>
      {loading && (
        <div className="loading-state">
          <Loader2 size={48} className="spinner-icon" />
          <p>Loading contests...</p>
        </div>
      )}
      {error && !loading && (
        <div className="error-message">
          <AlertTriangle size={32} /> {error}
        </div>
      )}
      {!loading && !error && contests.length === 0 && (
        <p className="no-contests">No upcoming contests found at the moment. Check back soon!</p>
      )}
      {!loading && !error && contests.length > 0 && (
        <motion.div
          className="contests-grid-layout"
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          {contests.map((contest) => (
            <ContestCard
              key={contest.id || contest._id} // Use clist.by 'id' or MongoDB '_id'
              contest={contest}
              onFavoriteToggle={userInfo ? handleFavoriteToggle : null} // Only allow fav if logged in
              isFavorite={favoriteContestIdentifiers.has(contest.id || contest._id)}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default ContestsPage;
