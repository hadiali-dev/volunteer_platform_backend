const Opportunity = require('../models/opportunity');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');

const populateConfig = [
  {
    path: 'organization',
    select: 'name email role image active createdAt updatedAt',
  },
  {
    path: 'likes.user',
    select: 'name email role image active createdAt updatedAt',
  },
  {
    path: 'comments.user',
    select: 'name email role image active createdAt updatedAt',
  },
  {
    path: 'comments.replies.user',
    select: 'name email role image active createdAt updatedAt',
  },
  {
    path: 'submittedBy',
    select: 'name email role image active createdAt updatedAt',
  },
  {
    path: 'reviewedBy',
    select: 'name email role image active createdAt updatedAt',
  },
];

class OpportunityService {
  static async getById(id) {
    const query = {
      _id: id,
      status: 'open',
      approvalStatus: 'approved',
    };

    const opportunity = await Opportunity.findOne(query).populate(populateConfig);

    if (!opportunity) {
      throw new AppError('Opportunity not found', 404);
    }

    return opportunity;
  }

  static async create(
    data,
    ownerId,
    { approvalStatus = 'approved', submittedBy = ownerId } = {},
  ) {
    const opportunity = await Opportunity.create({
      ...data,
      organization: ownerId,
      approvalStatus,
      submittedBy,
    });

    return Opportunity.findById(opportunity._id).populate(populateConfig);
  }

  static async update(id, data) {
    const opp = await Opportunity.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate(populateConfig);

    if (!opp) {
      throw new AppError('Opportunity not found', 404);
    }

    return opp;
  }

  static async delete(id) {
    const opp = await Opportunity.findByIdAndDelete(id);
    if (!opp) {
      throw new AppError('Opportunity not found', 404);
    }

    return opp;
  }

  static async getAll({ skip = 0, limit = 10 } = {}) {
    const query = { status: 'open', approvalStatus: 'approved' };

    const data = await Opportunity.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate(populateConfig);

    const total = await Opportunity.countDocuments(query);

    return { data, total };
  }

  static async getAllBySkills(skills, { skip = 0, limit = 10 } = {}) {
    const query = {
      status: 'open',
      approvalStatus: 'approved',
      requiredSkills: { $in: skills },
    };

    const data = await Opportunity.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate(populateConfig);

    const total = await Opportunity.countDocuments(query);

    return { data, total };
  }

  static async searchBar(search, { skip = 0, limit = 10 } = {}) {
    const regex = new RegExp(search, 'i');

    const query = {
      status: 'open',
      approvalStatus: 'approved',
      $or: [
        { title: regex },
        { description: regex },
        { category: regex },
        { requiredSkills: regex },
        { location: regex },
      ],
    };

    const data = await Opportunity.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate(populateConfig);

    const total = await Opportunity.countDocuments(query);

    return { data, total };
  }

  static async getPendingSubmissions({ skip = 0, limit = 10 } = {}) {
    const query = { approvalStatus: 'pending' };

    const data = await Opportunity.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: 1 })
      .populate(populateConfig);

    const total = await Opportunity.countDocuments(query);

    return { data, total };
  }

  static async reviewSubmission(id, adminId, decision) {
    const opportunity = await Opportunity.findById(id);
    if (!opportunity) {
      throw new AppError('Opportunity not found', 404);
    }

    opportunity.approvalStatus = decision;
    opportunity.reviewedBy = adminId;
    opportunity.reviewedAt = new Date();
    await opportunity.save();

    if (opportunity.submittedBy) {
      await Notification.create({
        user: opportunity.submittedBy,
        message:
          decision === 'approved'
            ? `Your opportunity "${opportunity.title}" was approved and published.`
            : `Your opportunity "${opportunity.title}" was rejected.`,
      });
    }

    return Opportunity.findById(id).populate(populateConfig);
  }

  static async toggleLike(opportunityId, userId) {
    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      throw new AppError('Opportunity not found', 404);
    }

    const existingLikeIndex = opportunity.likes.findIndex(
      (like) => String(like.user) === String(userId),
    );

    if (existingLikeIndex >= 0) {
      opportunity.likes.splice(existingLikeIndex, 1);
    } else {
      opportunity.likes.push({ user: userId });
    }

    await opportunity.save();

    return Opportunity.findById(opportunityId).populate(populateConfig);
  }

  static async addComment(opportunityId, userId, content) {
    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      throw new AppError('Opportunity not found', 404);
    }

    opportunity.comments.push({
      user: userId,
      content,
    });

    await opportunity.save();

    return Opportunity.findById(opportunityId).populate(populateConfig);
  }

  static async deleteComment(opportunityId, commentId, userId) {
    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      throw new AppError('Opportunity not found', 404);
    }

    const comment = opportunity.comments.id(commentId);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    if (String(comment.user) !== String(userId)) {
      throw new AppError('You can only delete your own comment', 403);
    }

    comment.deleteOne();
    await opportunity.save();

    return Opportunity.findById(opportunityId).populate(populateConfig);
  }

  static async addReplyToComment(opportunityId, commentId, userId, content) {
    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      throw new AppError('Opportunity not found', 404);
    }

    const comment = opportunity.comments.id(commentId);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    comment.replies.push({
      user: userId,
      content,
    });

    await opportunity.save();
    return Opportunity.findById(opportunityId).populate(populateConfig);
  }
}

module.exports = OpportunityService;
