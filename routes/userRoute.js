import express from 'express';
import User from '../models/userModel.js';

const router = express.Router();

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

router.post('/PhoneNumberAuth', async (req, res) => {
  try {
    const { number } = req.body;
    let user = await User.findOne({ phone: number });

    if (user) {
      const otp = generateOtp();
      console.log(otp)
      user.verificationCode = otp;
      user.verificationTimestamp = Date.now();
      await user.save();
      console.log(`OTP sent to existing user ${user.phone}: ${otp}`);
      return res.status(200).json({ message: 'OTP sent to existing user', otpSent: true });
    }
    else {
      const newUser = new User({
        phone: number,
        username: `user_${number}`,
      });
      const otp = generateOtp();
      newUser.verificationCode = otp;
      newUser.verificationTimestamp = Date.now();
      await newUser.save();
      console.log(`OTP sent to new user ${newUser.phone}: ${otp}`);
      return res.status(200).json({ message: 'OTP sent to new user', otpSent: true });
    }
  } catch (error) {
    console.error("Error during OTP generation:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // if (user.verificationCode === otp) {
    //   const now = Date.now();
    //   const otpValidityDuration = 5 * 60 * 1000; 

    //   if (now - user.verificationTimestamp > otpValidityDuration) {
    //     return res.status(400).json({ message: 'OTP has expired' });
    //   }

    //   user.phoneVerified = true;
    //   user.verificationCode = null;
    //   user.verificationTimestamp = null;
    //   await user.save();

      req.session.userId = user._id;
      req.session.phone = user.phone;

      return res.status(200).json({
        message: 'Phone number verified successfully',
        sessionId: req.sessionID,
      });
  } catch (error) {
    console.error("Error during OTP verification:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/check-session', (req, res) => {

    try {
        if (req.session.userId) {
            return res.status(200).json({  message: 'Session active',isAuthenticated:true, userId: req.session.userId });
          } else {
            return res.status(401).json({ message: 'No active session' });
          }
    } catch (error) {
        console.log(error)
    }
 
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }

    res.clearCookie('connect.sid'); 
    return res.status(200).json({ message: 'Logged out successfully' });
  });
});

export default router;
