/**
 * One-off admin provisioning script.
 *
 * Creates a new admin user, or promotes/resets an existing account to admin,
 * without going through the OTP signup flow. Takes credentials as CLI args
 * so nothing sensitive ever lives in this file.
 *
 * Usage:
 *   node scripts/createAdmin.js <email> <password> [name]
 */
import '../src/config/env.js';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const [, , email, password, name] = process.argv;

if (!email || !password) {
  console.error('Usage: node scripts/createAdmin.js <email> <password> [name]');
  process.exit(1);
}

if (password.length < 8) {
  console.error('❌ Password must be at least 8 characters');
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

  const normalizedEmail = email.toLowerCase().trim();
  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    user.passwordHash = password; // pre-save hook hashes this
    user.role = 'admin';
    user.isActive = true;
    user.emailVerified = true;
    if (!user.authProviders.includes('local')) user.authProviders.push('local');
    await user.save();
    console.log(`✅ Existing user promoted to admin: ${normalizedEmail}`);
  } else {
    user = new User({
      name: name || 'Admin',
      email: normalizedEmail,
      passwordHash: password,
      authProviders: ['local'],
      emailVerified: true,
      role: 'admin',
    });
    await user.save();
    console.log(`✅ New admin user created: ${normalizedEmail}`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('❌ Failed to create/promote admin:', err.message);
  process.exit(1);
});
