const mongoose = require('mongoose');
const Notification = require('./Notification');
const Opportunity = require('./opportunity');

const applicationSchema = new mongoose.Schema({
  opportunity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity',
    required: true,
  },
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  appliedAt: { type: Date, default: Date.now },
});

applicationSchema.index({ volunteer: 1, opportunity: 1 }, { unique: true });

const shouldNotifyStatusChange = (status) =>
  status === 'accepted' || status === 'rejected';

const syncOpportunityCapacityStatus = async (opportunityId) => {
  const opportunity = await Opportunity.findById(opportunityId)
    .select('maxVolunteers status')
    .lean();

  if (!opportunity || opportunity.status === 'closed') {
    return;
  }

  const acceptedApplicationsCount = await mongoose.model('Application').countDocuments({
    opportunity: opportunityId,
    status: 'accepted',
  });

  if (acceptedApplicationsCount >= opportunity.maxVolunteers) {
    await Opportunity.updateOne(
      { _id: opportunityId, status: 'open' },
      { $set: { status: 'closed' } },
    );
  }
};

const resolveOpportunityTitle = async (opportunityId) => {
  const opportunity = await Opportunity.findById(opportunityId).select('title').lean();
  return opportunity?.title ?? 'فرصة تطوعية';
};

const createStatusNotification = async ({ volunteerId, opportunityId, status }) => {
  if (!shouldNotifyStatusChange(status)) {
    return;
  }

  const opportunityTitle = await resolveOpportunityTitle(opportunityId);
  const isAccepted = status === 'accepted';

  await Notification.create({
    user: volunteerId,
    type: isAccepted ? 'application_accepted' : 'application_rejected',
    message: isAccepted
      ? `تم قبول طلبك على فرصة "${opportunityTitle}".`
      : `تم رفض طلبك على فرصة "${opportunityTitle}".`,
  });
};

applicationSchema.pre('save', async function preloadPreviousStatus() {
  if (this.isNew || !this.isModified('status')) {
    return;
  }

  const previous = await this.constructor
    .findById(this._id)
    .select('status volunteer opportunity')
    .lean();
  this.$locals.previousStatus = previous?.status;
});

applicationSchema.post('save', async function notifyOnSave(doc) {
  const previousStatus = doc.$locals.previousStatus;
  if (!previousStatus || previousStatus === doc.status) {
    return;
  }

  await createStatusNotification({
    volunteerId: doc.volunteer,
    opportunityId: doc.opportunity,
    status: doc.status,
  });

  await syncOpportunityCapacityStatus(doc.opportunity);
});

applicationSchema.pre('findOneAndUpdate', async function preloadPreviousStatusForQuery() {
  const update = this.getUpdate();
  const nextStatus =
    update && typeof update === 'object'
      ? update.$set?.status ?? update.status
      : undefined;
  this._nextStatusFromUpdate = typeof nextStatus === 'string' ? nextStatus : undefined;

  this._previousApplication = await this.model
    .findOne(this.getQuery())
    .select('status volunteer opportunity')
    .lean();
});

applicationSchema.post(
  'findOneAndUpdate',
  async function notifyOnFindOneAndUpdate(updatedDoc) {
    const previous = this._previousApplication;
    const nextStatus = this._nextStatusFromUpdate ?? updatedDoc?.status;

    if (!previous || !nextStatus || previous.status === nextStatus) {
      return;
    }

    await createStatusNotification({
      volunteerId: previous.volunteer,
      opportunityId: previous.opportunity,
      status: nextStatus,
    });

    await syncOpportunityCapacityStatus(previous.opportunity);
  },
);

module.exports = mongoose.model('Application', applicationSchema);
