import AdminJS, { ComponentLoader } from 'adminjs';
import * as AdminJSExpress from '@adminjs/express';
import * as AdminJSMongoose from '@adminjs/mongoose';
import bcrypt from 'bcryptjs';
import MongoStore from 'connect-mongo';
import path from 'path';
import { fileURLToPath } from 'url';
import MongooseProperty from '../../node_modules/@adminjs/mongoose/lib/property.js';

import Application from '../models/application.js';
import Announcement from '../models/announcement.js';
import Notification from '../models/Notification.js';
import Opportunity from '../models/opportunity.js';
import User from '../models/user.js';
import VolunteerProfile from '../models/volunteerProfile.js';

const rootPath = '/admin';
const mongoUrl = process.env.DATABASE_URL || process.env.MONGO_URI;
const sessionSecret = process.env.ADMIN_SECRET || process.env.JWT_SECRET || 'admin-secret';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const componentLoader = new ComponentLoader();

const Components = {
  OpportunityStatusDashboard: componentLoader.add(
    'OpportunityStatusDashboard',
    path.join(__dirname, 'components', 'opportunity-status-dashboard.jsx'),
  ),
};

const patchAdminJsMongooseForMongoose9 = () => {
  if (MongooseProperty.prototype.__volMongoose9Patched) {
    return;
  }

  MongooseProperty.prototype.__volMongoose9Patched = true;

  MongooseProperty.prototype.reference = function reference() {
    if (this.isArray()) {
      const ref =
        this.mongoosePath.caster?.options?.ref ??
        this.mongoosePath.embeddedSchemaType?.options?.ref;

      if (typeof ref === 'function') {
        return ref.modelName;
      }

      return ref;
    }

    const ref = this.mongoosePath.options?.ref;
    if (typeof ref === 'function') {
      return ref.modelName;
    }

    return ref;
  };

  MongooseProperty.prototype.subProperties = function subProperties() {
    if (this.type() === 'mixed') {
      const schema = this.mongoosePath.caster?.schema ?? this.mongoosePath.schema;
      const subPaths = schema ? Object.values(schema.paths) : [];
      return subPaths.map((property) => new MongooseProperty(property));
    }

    return [];
  };

  MongooseProperty.prototype.type = function type() {
    if (this.isArray()) {
      let instance =
        this.mongoosePath.caster?.instance ??
        this.mongoosePath.embeddedSchemaType?.instance;

      if (!instance && (this.mongoosePath.caster?.schema || this.mongoosePath.schema)) {
        instance = 'Embedded';
      }

      return this.instanceToType(instance);
    }

    return this.instanceToType(this.mongoosePath.instance);
  };
};

patchAdminJsMongooseForMongoose9();

AdminJS.registerAdapter({
  Database: AdminJSMongoose.Database,
  Resource: AdminJSMongoose.Resource,
});

const availableRoleValues = [
  { value: 'student', label: 'Student' },
  { value: 'organization', label: 'Organization' },
  { value: 'admin', label: 'Admin' },
];

const buildUserResourceOptions = () => ({
  navigation: { name: 'Access', icon: 'User' },
  listProperties: ['name', 'email', 'role', 'active', 'createdAt'],
  showProperties: ['name', 'email', 'role', 'active', 'createdAt', 'updatedAt'],
  editProperties: ['name', 'email', 'password', 'role', 'image', 'active'],
  filterProperties: ['name', 'email', 'role', 'active', 'createdAt'],
  properties: {
    password: {
      type: 'password',
      isVisible: { list: false, filter: false, show: false, edit: true },
    },
    role: {
      availableValues: availableRoleValues,
    },
  },
  actions: {
    new: {
      before: async (request) => {
        if (request.payload?.password) {
          request.payload = {
            ...request.payload,
            password: await bcrypt.hash(request.payload.password, 12),
          };
        }
        return request;
      },
    },
    edit: {
      before: async (request) => {
        if (!request.payload) {
          return request;
        }

        if (request.payload.password) {
          request.payload = {
            ...request.payload,
            password: await bcrypt.hash(request.payload.password, 12),
          };
        } else {
          delete request.payload.password;
        }

        return request;
      },
    },
  },
});

const buildOpportunityResourceOptions = () => ({
  navigation: { name: 'Volunteering', icon: 'Events' },
  listProperties: [
    'title',
    'organization',
    'category',
    'status',
    'approvalStatus',
    'date',
  ],
  showProperties: [
    'title',
    'description',
    'organization',
    'submittedBy',
    'reviewedBy',
    'approvalStatus',
    'status',
    'category',
    'location',
    'requiredSkills',
    'hours',
    'maxVolunteers',
    'date',
    'image',
    'likes',
    'comments',
    'createdAt',
    'updatedAt',
  ],
  editProperties: [
    'title',
    'description',
    'organization',
    'submittedBy',
    'reviewedBy',
    'approvalStatus',
    'status',
    'category',
    'location',
    'requiredSkills',
    'hours',
    'maxVolunteers',
    'date',
    'image',
  ],
  filterProperties: [
    'title',
    'organization',
    'category',
    'status',
    'approvalStatus',
    'date',
  ],
  properties: {
    category: {
      availableValues: [
        { value: 'educational', label: 'Educational' },
        { value: 'health', label: 'Health' },
        { value: 'environmental', label: 'Environmental' },
        { value: 'social', label: 'Social' },
      ],
    },
    status: {
      availableValues: [
        { value: 'open', label: 'Open' },
        { value: 'closed', label: 'Closed' },
      ],
    },
    approvalStatus: {
      availableValues: [
        { value: 'pending', label: 'Pending review' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
      ],
    },
    likes: {
      isVisible: { list: false, filter: false, edit: false, show: true },
    },
    comments: {
      isVisible: { list: false, filter: false, edit: false, show: true },
    },
  },
});

const buildApplicationResourceOptions = () => ({
  navigation: { name: 'Volunteering', icon: 'Task' },
  listProperties: ['opportunity', 'volunteer', 'status', 'appliedAt'],
  showProperties: ['opportunity', 'volunteer', 'status', 'appliedAt'],
  editProperties: ['opportunity', 'volunteer', 'status', 'appliedAt'],
  filterProperties: ['opportunity', 'volunteer', 'status', 'appliedAt'],
  properties: {
    status: {
      availableValues: [
        { value: 'pending', label: 'Pending' },
        { value: 'accepted', label: 'Accepted' },
        { value: 'rejected', label: 'Rejected' },
      ],
    },
  },
});

const buildNotificationResourceOptions = () => ({
  navigation: { name: 'Engagement', icon: 'Notification' },
  listProperties: ['user', 'message', 'isRead', 'createdAt'],
  showProperties: ['user', 'message', 'isRead', 'createdAt'],
  editProperties: ['user', 'message', 'isRead', 'createdAt'],
  filterProperties: ['user', 'isRead', 'createdAt'],
});

const buildProfileResourceOptions = () => ({
  navigation: { name: 'Engagement', icon: 'User' },
  listProperties: ['user', 'totalHours', 'skills', 'interests', 'updatedAt'],
  showProperties: [
    'user',
    'image',
    'skills',
    'interests',
    'bio',
    'totalHours',
    'createdAt',
    'updatedAt',
  ],
  editProperties: ['user', 'image', 'skills', 'interests', 'bio', 'totalHours'],
  filterProperties: ['user', 'totalHours', 'createdAt', 'updatedAt'],
});

const buildAnnouncementResourceOptions = () => ({
  navigation: { name: 'Content', icon: 'Bullhorn' },
  listProperties: ['title', 'isActive', 'createdBy', 'updatedBy', 'updatedAt'],
  showProperties: [
    'title',
    'description',
    'backgroundImage',
    'isActive',
    'createdBy',
    'updatedBy',
    'createdAt',
    'updatedAt',
  ],
  editProperties: ['title', 'description', 'backgroundImage', 'isActive'],
  filterProperties: ['title', 'isActive', 'createdAt', 'updatedAt'],
  actions: {
    new: {
      before: async (request, context) => {
        if (!request.payload) {
          return request;
        }

        const actorId = context.currentAdmin?._id;
        if (!actorId) {
          return request;
        }

        request.payload = {
          ...request.payload,
          createdBy: actorId,
          updatedBy: actorId,
        };

        return request;
      },
    },
    edit: {
      before: async (request, context) => {
        if (!request.payload) {
          return request;
        }

        const actorId = context.currentAdmin?._id;
        if (!actorId) {
          return request;
        }

        request.payload = {
          ...request.payload,
          updatedBy: actorId,
        };

        return request;
      },
    },
  },
});

const createAdmin = () =>
  new AdminJS({
    rootPath,
    componentLoader,
    branding: {
      companyName: 'Vol Admin',
      softwareBrothers: false,
      withMadeWithLove: false,
      favicon: false,
      logo: false,
      theme: {
        colors: {
          primary100: '#2f6b52',
          primary80: '#498a68',
          primary60: '#73a888',
          accent: '#d87953',
          hoverBg: '#eef4f0',
          bg: '#f6f1e7',
          container: '#fffaf2',
          info: '#2f6b52',
        },
      },
    },
    locale: {
      language: 'en',
      translations: {
        labels: {
          User: 'Users',
          Opportunity: 'Opportunities',
          Application: 'Applications',
          Announcement: 'Announcements',
          Notification: 'Notifications',
          VolunteerProfile: 'Profiles',
        },
      },
    },
    dashboard: {
      component: Components.OpportunityStatusDashboard,
      handler: async () => {
        const [
          allCount,
          openCount,
          closedCount,
          pendingApprovalCount,
          approvedCount,
          rejectedCount,
        ] = await Promise.all([
          Opportunity.countDocuments({}),
          Opportunity.countDocuments({ status: 'open' }),
          Opportunity.countDocuments({ status: 'closed' }),
          Opportunity.countDocuments({ approvalStatus: 'pending' }),
          Opportunity.countDocuments({ approvalStatus: 'approved' }),
          Opportunity.countDocuments({ approvalStatus: 'rejected' }),
        ]);

        return {
          allCount,
          openCount,
          closedCount,
          pendingApprovalCount,
          approvedCount,
          rejectedCount,
        };
      },
    },
    resources: [
      { resource: User, options: buildUserResourceOptions() },
      { resource: Opportunity, options: buildOpportunityResourceOptions() },
      { resource: Application, options: buildApplicationResourceOptions() },
      { resource: Announcement, options: buildAnnouncementResourceOptions() },
      { resource: Notification, options: buildNotificationResourceOptions() },
      { resource: VolunteerProfile, options: buildProfileResourceOptions() },
    ],
  });

export const mountAdminPanel = async (app) => {
  const admin = createAdmin();

  const router = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate: async (email, password) => {
        if (!email || !password) {
          return null;
        }

        const adminUser = await User.findOne({ email, role: 'admin', active: true })
          .select('+password')
          .lean();

        if (!adminUser?.password) {
          return null;
        }

        const isValid = await bcrypt.compare(password, adminUser.password);
        if (!isValid) {
          return null;
        }

        return {
          _id: String(adminUser._id),
          email: adminUser.email,
          title: adminUser.name,
          role: adminUser.role,
        };
      },
      cookiePassword: sessionSecret,
      cookieName: 'vol-admin',
    },
    null,
    {
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: mongoUrl ? MongoStore.create({ mongoUrl }) : undefined,
      cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 8,
      },
      name: 'vol-admin-session',
    }
  );

  app.use(rootPath, (req, res, next) => {
    res.set({
      'Content-Security-Policy': [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'self'",
        "img-src 'self' data: blob:",
        "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com data:",
        "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "connect-src 'self'",
      ].join('; '),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'Surrogate-Control': 'no-store',
    });
    next();
  }, router);

  return { admin, rootPath };
};
