import mongoose from 'mongoose';

const otpVerificationSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, index: true },
  otpHash: { type: String, required: true },
  userData: {
    name: String,
    password: String,       // raw password — hashed when user is created
    phoneNumber: String
  },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 600 }  // auto-delete after 10 min
});

export default mongoose.model('OtpVerification', otpVerificationSchema);
