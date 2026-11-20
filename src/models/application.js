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
  ['pending', 'accepted', 'rejected'].includes(status);

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
  
  let type, message;
  if (status === 'accepted') {
    type = 'application_accepted';
    message = `تم قبول طلبك على فرصة "${opportunityTitle}".`;
  } else if (status === 'rejected') {
    type = 'application_rejected';
    message = `تم رفض طلبك على فرصة "${opportunityTitle}".`;
  } else if (status === 'pending') {
    type = 'application_pending';
    message = `لقد تقدمت بطلب للفرصة "${opportunityTitle}".`;
  }

  await Notification.create({
    user: volunteerId,
    type,
    message,
  });
};

applicationSchema.pre('save', async function preloadPreviousStatus() {
  if (this.isNew) {
    this.$locals.isNew = true;
    return;
  }

  if (!this.isModified('status')) {
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
  const isNew = doc.$locals.isNew;

  if (isNew || (previousStatus && previousStatus !== doc.status)) {
    await createStatusNotification({
      volunteerId: doc.volunteer,
      opportunityId: doc.opportunity,
      status: doc.status,
    });

    if (doc.status === 'accepted') {
      await syncOpportunityCapacityStatus(doc.opportunity);
    }
  }
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
