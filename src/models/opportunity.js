const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    likedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    replies: {
      type: [
        new mongoose.Schema(
          {
            user: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
              required: true,
            },
            content: {
              type: String,
              required: true,
              trim: true,
            },
            createdAt: {
              type: Date,
              default: Date.now,
            },
          },
          { _id: true },
        ),
      ],
      default: [],
    },
  },
  { _id: true },
);

const opportunitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hours: { type: Number, default: 0 },
    image: { type: String, default: null },
    location: { type: String, required: true },
    category: {
      type: String,
      enum: ['educational', 'health', 'environmental', 'social'],
      required: true,
    },
    requiredSkills: { type: [String], default: [] },
    date: { type: Date, required: true },
    maxVolunteers: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    likes: {
      type: [likeSchema],
      default: [],
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Opportunity', opportunitySchema);
