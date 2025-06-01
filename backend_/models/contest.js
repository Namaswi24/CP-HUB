import mongoose from 'mongoose';

const contestSchema = new mongoose.Schema({
  clistId: { // ID from Clist.by, used for syncing and preventing duplicates
    type: Number,
    unique: true, // Each contest from Clist.by should only be stored once
    sparse: true, // Allows null values for manually added contests not from Clist.by
  },
  title: { // Renamed from 'name' for consistency
    type: String,
    required: true,
    trim: true,
  },
  platform: { // e.g., "Codeforces", "AtCoder" - standardized from Clist.by or manual input
    type: String,
    required: true,
    trim: true,
  },
  platformIcon: { // URL to the platform's icon, primarily from Clist.by
    type: String,
    trim: true,
  },
  startTime: { // Renamed from 'start'
    type: Date,
    required: true,
  },
  endTime: { // Renamed from 'end'
    type: Date,
    required: true,
  },
  durationSeconds: { // Duration in seconds
    type: Number,
  },
  url: { // Direct link to the contest page
    type: String,
    required: true,
    trim: true,
  },
  description: { // Optional description
    type: String,
    trim: true,
  },
  apiSource: { // To track if it was fetched from 'clist.by' or added 'manual'
    type: String,
    enum: ['clist.by', 'manual', 'other_api'],
    default: 'manual',
  },
  lastFetchedFromApiAt: { // Timestamp of when it was last synced from an API
    type: Date,
  },
  // You can add more fields as needed, e.g., specific tags, problem count if available
}, {
  timestamps: true, // Adds createdAt and updatedAt Mongoose timestamps
});

// Index for faster querying by start time, crucial for fetching upcoming contests
contestSchema.index({ startTime: 1 });
contestSchema.index({ platform: 1 });

// If you are using CommonJS modules (based on your `require` in the controller you shared)
// const Contest = mongoose.model('Contest', contestSchema);
// module.exports = Contest;

// If you are using ES Modules (import/export)
const Contest = mongoose.model('Contest', contestSchema);
export default Contest;
