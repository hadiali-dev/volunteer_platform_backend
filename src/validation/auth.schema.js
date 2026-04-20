const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const signupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3, 'Name must be at least 3 characters'),
    email: z.string().trim().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['student', 'organization']).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

const volunteerProfileSchema = z.object({
  body: z
    .object({
      skills: z.array(z.string().trim().min(1)).optional(),
      interests: z.array(z.string().trim().min(1)).optional(),
      bio: z.string().trim().max(500, 'Bio must not exceed 500 characters').optional(),
      image: z.string().trim().url('Image must be a valid URL').optional(),
    })
    .refine(
      (body) =>
        body.skills !== undefined ||
        body.interests !== undefined ||
        body.bio !== undefined ||
        body.image !== undefined,
      'At least one profile field is required',
    ),
});

const opportunitySchema = z.object({
  body: z.object({
    title: z.string().trim().min(5, 'Title must be at least 5 characters'),
    description: z.string().trim().min(20, 'Description must be at least 20 characters'),
    location: z.string().trim().min(3, 'Location is required'),
    category: z.enum(['educational', 'health', 'environmental', 'social']),
    requiredSkills: z.array(z.string().trim()).default([]),
    date: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date'),
    maxVolunteers: z.number().int().min(1, 'maxVolunteers must be at least 1'),
    hours: z.number().int().min(0).optional(),
    image: z.string().trim().url('Image must be a valid URL').optional(),
    status: z.enum(['open', 'closed']).optional(),
  }),
});

const applicationSchema = z.object({
  body: z.object({
    opportunityId: objectId,
  }),
});

const searchSchema = z.object({
  query: z.object({
    search: z.string().trim().min(1, 'Search query is required'),
  }),
});

const commentSchema = z.object({
  body: z.object({
    content: z.string().trim().min(1, 'Comment content is required').max(500),
  }),
});

const replySchema = z.object({
  body: z.object({
    content: z.string().trim().min(1, 'Reply content is required').max(500),
  }),
  params: z.object({
    id: objectId,
    commentId: objectId,
  }),
});

const statusUpdateSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'accepted', 'rejected']),
  }),
  params: z.object({
    appId: objectId,
  }),
});

const opportunityReviewSchema = z.object({
  body: z.object({
    decision: z.enum(['approved', 'rejected']),
  }),
  params: z.object({
    id: objectId,
  }),
});

const announcementSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters'),
    description: z.string().trim().min(10, 'Description must be at least 10 characters'),
    backgroundImage: z.string().trim().url('Background image must be a valid URL'),
    isActive: z.boolean().optional(),
  }),
});

module.exports = {
  announcementSchema,
  applicationSchema,
  commentSchema,
  loginSchema,
  opportunitySchema,
  opportunityReviewSchema,
  replySchema,
  searchSchema,
  signupSchema,
  statusUpdateSchema,
  volunteerProfileSchema,
};
