const mongoose = require('mongoose');

const volunteerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    image: { type: String, default: null },
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    bio: { type: String, default: '' },
    totalHours: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model('VolunteerProfile', volunteerProfileSchema);
