const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const connectDB = require('../src/config/db');
const User = require('../src/models/user');

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || 'Admin User';

const run = async () => {
  if (!email || !password) {
    throw new Error(
      'Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment variables.',
    );
  }

  await connectDB();

  const hashedPassword = await bcrypt.hash(password, 12);
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    existingUser.name = existingUser.name || name;
    existingUser.password = hashedPassword;
    existingUser.role = 'admin';
    existingUser.active = true;
    await existingUser.save();

    console.log(`Updated existing user ${email} as admin.`);
  } else {
    await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      active: true,
    });

    console.log(`Created admin user ${email}.`);
  }

  process.exit(0);
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
