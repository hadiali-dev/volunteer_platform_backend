const express = require('express');
const router = express.Router();

const { AdminController, UserController } = require('../controllers/allControllers');
const { protect, restrictTo } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  applicationSchema,
  commentSchema,
  opportunitySchema,
  opportunityReviewSchema,
  replySchema,
  searchSchema,
  statusUpdateSchema,
  volunteerProfileSchema,
} = require('../validation/auth.schema');

router.get('/public/stats', UserController.getPublicStats);
router.get('/profile', protect, restrictTo('student'), UserController.getMyProfile);
router.get('/opportunities', protect, UserController.getOpps);
router.get('/opportunities/:id', protect, UserController.getOppById);
router.get('/opportunitiesByskills', protect, UserController.getOppsBySkills);
router.get('/search', protect, validate(searchSchema), UserController.searchBar);
router.get('/notifications', protect, UserController.getMyNotifications);
router.get('/announcements/active', protect, UserController.getActiveAnnouncement);
router.get('/my-applications', protect, restrictTo('student'), UserController.getMyApps);
router.post(
  '/opportunities',
  protect,
  restrictTo('student', 'organization'),
  validate(opportunitySchema),
  UserController.submitOpportunity,
);

router.post(
  '/apply',
  protect,
  restrictTo('student'),
  validate(applicationSchema),
  UserController.apply,
);
router.post(
  '/opportunities/:id/comments',
  protect,
  validate(commentSchema),
  UserController.addComment,
);
router.post(
  '/opportunities/:id/comments/:commentId/replies',
  protect,
  validate(replySchema),
  UserController.addReplyToComment,
);

router.patch(
  '/profile',
  protect,
  restrictTo('student'),
  validate(volunteerProfileSchema),
  UserController.updateMyProfile,
);
router.patch('/notifications/:id/read', protect, UserController.markAsRead);
router.patch('/opportunities/:id/like', protect, UserController.toggleLike);

router.delete(
  '/opportunities/:id/comments/:commentId',
  protect,
  UserController.deleteComment,
);

router.get('/admin/apps', protect, restrictTo('admin'), AdminController.getAllApps);
router.get('/admin/opps', protect, restrictTo('admin'), AdminController.getSubmittedOpps);
router.post(
  '/admin/opps',
  protect,
  restrictTo('admin'),
  validate(opportunitySchema),
  AdminController.createOpp,
);
router.patch(
  '/admin/apps/:appId',
  protect,
  restrictTo('admin'),
  validate(statusUpdateSchema),
  AdminController.manageApp,
);
router.patch(
  '/admin/opps/:id/review',
  protect,
  restrictTo('admin'),
  validate(opportunityReviewSchema),
  AdminController.reviewOpp,
);
router.patch(
  '/apps/:appId/status',
  protect,
  restrictTo('admin'),
  validate(statusUpdateSchema),
  AdminController.manageApp,
);
router.delete('/admin/opps/:id', protect, restrictTo('admin'), AdminController.deleteOpp);
router.patch('/admin/opps/:id', protect, restrictTo('admin'), AdminController.updateOpp);

module.exports = router;
