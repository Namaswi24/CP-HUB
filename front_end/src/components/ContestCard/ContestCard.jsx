import React from "react";
import { format, formatDistanceStrict } from "date-fns"; // For better date formatting
import { ExternalLink, CalendarPlus, Star, ShieldAlert } from "lucide-react"; // Using lucide-react
import { motion } from "framer-motion";
import "./ContestCard.css";

// Helper to generate .ics data
const generateICSData = (contest) => {
  const formatDateForICS = (dateStr) => new Date(dateStr).toISOString().replace(/-|:|\.\d{3}/g, '');
  const startDateICS = formatDateForICS(contest.startTime);
  const endDateICS = formatDateForICS(contest.endTime);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CPHub//ContestReminder//EN",
    "BEGIN:VEVENT",
    `UID:${contest.id || contest.title.replace(/\s+/g, '')}@cphub.com`,
    `DTSTAMP:${formatDateForICS(new Date())}`,
    `DTSTART:${startDateICS}`,
    `DTEND:${endDateICS}`,
    `SUMMARY:${contest.title}`,
    `DESCRIPTION:Platform: ${contest.platform}\\nLink: ${contest.url}`,
    `URL:${contest.url}`,
    `LOCATION:${contest.platform}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\n");
};

const ContestCard = ({ contest, onFavoriteToggle, isFavorite }) => {
  const { title, platform, platformIcon, startTime, endTime, durationSeconds, url, id } = contest;

  const handleAddToCalendar = () => {
    const icsContent = generateICSData(contest);
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const formattedStartTime = startTime ? format(new Date(startTime), "MMM dd, yyyy 'at' hh:mm a") : "N/A";
  const formattedEndTime = endTime ? format(new Date(endTime), "MMM dd, yyyy 'at' hh:mm a") : "N/A";
  const durationStr = durationSeconds
    ? formatDistanceStrict(new Date(0), new Date(durationSeconds * 1000), { unit: 'hour', roundingMethod: 'floor' }) +
      " " + formatDistanceStrict(new Date(0), new Date(durationSeconds * 1000), { unit: 'minute' })
    : "N/A";

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <motion.div className="contest-card-item" variants={itemVariants} whileHover={{ y: -5 }}>
      <div className="contest-card-header">
        {platformIcon ? (
          <img src={platformIcon} alt={platform} className="platform-icon" onError={(e) => e.target.style.display='none'} />
        ) : (
          <ShieldAlert size={24} className="platform-icon-default" />
        )}
        <h3 className="contest-title" title={title}>
          {title.length > 50 ? title.substring(0, 47) + "..." : title}
        </h3>
        {onFavoriteToggle && (
          <button
            onClick={() => onFavoriteToggle(contest)} /* Pass contest object or ID */
            className={`favorite-btn ${isFavorite ? "favorited" : ""}`}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star size={20} />
          </button>
        )}
      </div>
      <p className="contest-platform"><strong>Platform:</strong> {platform || "N/A"}</p>
      <p className="contest-time"><strong>Start:</strong> {formattedStartTime}</p>
      <p className="contest-time"><strong>End:</strong> {formattedEndTime}</p>
      <p className="contest-duration"><strong>Duration:</strong> {durationStr.replace(' 0 minutes','').replace(' 0 hours','') || 'N/A'}</p>
      <div className="contest-card-actions">
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
          <ExternalLink size={16} /> Visit Contest
        </a>
        <button onClick={handleAddToCalendar} className="btn btn-secondary">
          <CalendarPlus size={16} /> Add to Calendar
        </button>
      </div>
    </motion.div>
  );
};

export default ContestCard;
