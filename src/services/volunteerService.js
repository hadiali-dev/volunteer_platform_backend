const VolunteerProfile = require('../models/volunteerProfile');
const AppError = require('../utils/AppError');

class VolunteerService {
  static async updateProfile(userId, data) {
    return VolunteerProfile.findOneAndUpdate(
      { user: userId },
      { ...data, user: userId },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).populate('user', 'name email role image active createdAt updatedAt');
  }

  static async getProfile(userId) {
    const profile = await VolunteerProfile.findOne({ user: userId }).populate(
      'user',
      'name email role image active createdAt updatedAt',
    );

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    return profile;
  }
}

module.exports = VolunteerService;
