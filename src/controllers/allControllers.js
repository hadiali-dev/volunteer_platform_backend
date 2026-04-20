const Application = require('../models/application');
const Announcement = require('../models/announcement');
const Notification = require('../models/Notification');
const Opportunity = require('../models/opportunity');
const User = require('../models/user');
const VolunteerProfile = require('../models/volunteerProfile');
const OpportunityService = require('../services/opportunityService');
const VolunteerService = require('../services/volunteerService');
const ApplicationService = require('../services/applicationService');
const AppError = require('../utils/AppError');
const pagination = require('../utils/pagination');

class AdminController {
  static async getSubmittedOpps(req, res) {
    const pg = pagination(req);
    const { data, total } = await OpportunityService.getPendingSubmissions(pg);

    res.status(200).json({
      status: 'success',
      results: data.length,
      page: pg.page,
      total,
      data,
    });
  }

  static async createOpp(req, res) {
    const opp = await OpportunityService.create(req.body, req.user._id);
    res.status(201).json({ status: 'success', data: opp });
  }

  static async updateOpp(req, res) {
    const opp = await OpportunityService.update(req.params.id, req.body);
    res.status(200).json({ status: 'success', data: opp });
  }

  static async deleteOpp(req, res) {
    await OpportunityService.delete(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  }

  static async getAllApps(req, res) {
    const pg = pagination(req);
    const { data, total } = await ApplicationService.getAllApplications(pg);

    res.status(200).json({
      status: 'success',
      results: data.length,
      page: pg.page,
      total,
      data,
    });
  }

  static async manageApp(req, res) {
    const updatedApp = await ApplicationService.updateStatus(
      req.params.appId,
      req.body.status,
    );

    res.status(200).json({
      status: 'success',
      message: `Application status updated to ${req.body.status} successfully`,
      data: updatedApp,
    });
  }

  static async reviewOpp(req, res) {
    const opp = await OpportunityService.reviewSubmission(
      req.params.id,
      req.user._id,
      req.body.decision,
    );

    res.status(200).json({
      status: 'success',
      message: `Opportunity ${req.body.decision} successfully`,
      data: opp,
    });
  }
}

class UserController {
  static async getOppById(req, res) {
    const opportunity = await OpportunityService.getById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: opportunity,
    });
  }

  static async getOpps(req, res) {
    const pg = pagination(req);
    const { data, total } = await OpportunityService.getAll(pg);

    res.status(200).json({
      status: 'success',
      results: data.length,
      page: pg.page,
      total,
      data,
    });
  }

  static async searchBar(req, res) {
    const pg = pagination(req);
    const { data, total } = await OpportunityService.searchBar(req.query.search, pg);

    res.status(200).json({
      status: 'success',
      results: data.length,
      page: pg.page,
      total,
      data,
    });
  }

  static async getPublicStats(req, res) {
    const activeOpps = await Opportunity.countDocuments({ status: 'open' });
    const volunteers = await User.countDocuments({ role: 'student' });
    const hoursData = await VolunteerProfile.aggregate([
      { $group: { _id: null, total: { $sum: '$totalHours' } } },
    ]);
    const totalHours = hoursData[0]?.total || 0;

    res.status(200).json({
      status: 'success',
      data: { activeOpps, volunteers, totalHours },
    });
  }

  static async getActiveAnnouncement(req, res) {
    const announcement = await Announcement.findOne({ isActive: true })
      .sort({ updatedAt: -1, createdAt: -1 })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.status(200).json({
      status: 'success',
      data: announcement,
    });
  }

  static async getMyProfile(req, res) {
    let profile = await VolunteerProfile.findOne({ user: req.user._id }).populate(
      'user',
      'name email role image active createdAt updatedAt',
    );

    if (!profile) {
      profile = await VolunteerProfile.create({
        user: req.user._id,
        skills: [],
        interests: [],
        bio: 'Welcome! Add your story, skills, and interests to complete your profile.',
      });

      profile = await VolunteerProfile.findById(profile._id).populate(
        'user',
        'name email role image active createdAt updatedAt',
      );
    }

    const [completedOpportunities, pendingApplications, cancelledApplications] =
      await Promise.all([
        Application.countDocuments({
          volunteer: req.user._id,
          status: { $in: ['accepted', 'approved'] },
        }),
        Application.countDocuments({
          volunteer: req.user._id,
          status: 'pending',
        }),
        Application.countDocuments({
          volunteer: req.user._id,
          status: 'rejected',
        }),
      ]);

    res.status(200).json({
      status: 'success',
      data: {
        ...profile.toObject(),
        completedOpportunities,
        pendingApplications,
        cancelledApplications,
        joinedAt: profile.createdAt,
      },
    });
  }

  static async getOppsBySkills(req, res) {
    const pg = pagination(req);
    const profile = await VolunteerProfile.findOne({ user: req.user._id });

    if (!profile || profile.skills.length === 0) {
      return res.status(200).json({
        status: 'success',
        results: 0,
        page: pg.page,
        total: 0,
        data: [],
        message: 'Please add skills to your profile first',
      });
    }

    const { data, total } = await OpportunityService.getAllBySkills(profile.skills, pg);

    res.status(200).json({
      status: 'success',
      results: data.length,
      page: pg.page,
      total,
      data,
    });
  }

  static async apply(req, res) {
    const app = await ApplicationService.apply(req.user._id, req.body.opportunityId);
    res.status(201).json({ status: 'success', data: app });
  }

  static async submitOpportunity(req, res) {
    const opp = await OpportunityService.create(req.body, req.user._id, {
      approvalStatus: 'pending',
      submittedBy: req.user._id,
    });

    res.status(201).json({
      status: 'success',
      message: 'Opportunity submitted for admin review',
      data: opp,
    });
  }

  static async getMyApps(req, res) {
    const pg = pagination(req);
    const rawStatus = typeof req.query.status === 'string' ? req.query.status : undefined;
    const status =
      rawStatus === 'pending' || rawStatus === 'accepted' || rawStatus === 'rejected'
        ? rawStatus
        : undefined;

    const { data, total } = await ApplicationService.getMyApplications(req.user._id, {
      ...pg,
      status,
    });

    res.status(200).json({
      status: 'success',
      results: data.length,
      page: pg.page,
      total,
      data,
    });
  }

  static async updateMyProfile(req, res) {
    const profile = await VolunteerService.updateProfile(req.user._id, req.body);
    res.status(200).json({ status: 'success', data: profile });
  }

  static async getMyNotifications(req, res) {
    const notifications = await Notification.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ status: 'success', data: notifications });
  }

  static async markAsRead(req, res) {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      {
        isRead: true,
      },
      { new: true },
    );

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: notification,
    });
  }

  static async toggleLike(req, res) {
    const opportunity = await OpportunityService.toggleLike(req.params.id, req.user._id);
    res.status(200).json({ status: 'success', data: opportunity });
  }

  static async addComment(req, res) {
    const opportunity = await OpportunityService.addComment(
      req.params.id,
      req.user._id,
      req.body.content,
    );
    res.status(201).json({ status: 'success', data: opportunity });
  }

  static async deleteComment(req, res) {
    const opportunity = await OpportunityService.deleteComment(
      req.params.id,
      req.params.commentId,
      req.user._id,
    );
    res.status(200).json({ status: 'success', data: opportunity });
  }

  static async addReplyToComment(req, res) {
    const opportunity = await OpportunityService.addReplyToComment(
      req.params.id,
      req.params.commentId,
      req.user._id,
      req.body.content,
    );
    res.status(201).json({ status: 'success', data: opportunity });
  }
}

module.exports = { AdminController, UserController };
