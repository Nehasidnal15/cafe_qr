const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/email');

router.post('/login', async (req, res) => {
  try {
    let { username, password } = req.body; 
    // Fallback: If user types 'admin', map it to the actual admin email
    if (username === 'admin') {
      username = 'nehasidnal15.mca@gmail.com';
    }
    const admin = await Admin.findByEmail(username);
    if (!admin) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, username: admin.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('[DEBUG] Forgot Password Request for:', email);
    const admin = await Admin.findByEmail(email);
    
    if (!admin) {
      console.log('[DEBUG] Admin not found for email:', email);
      return res.status(404).json({ message: 'Admin with this email not found' });
    }

    console.log('[DEBUG] Found Admin. Generating OTP...');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); 

    await Admin.updateOTP(email, otp, expiry);
    
    // --> LOG OTP TO CONSOLE TO UNBLOCK USER <--
    console.log('\n=============================================');
    console.log(`🔑 DEV MODE: Your OTP is: ${otp}`);
    console.log('=============================================\n');
    console.log('[DEBUG] OTP updated in DB. Sending email...');
    
    await sendOTPEmail(email, otp);
    console.log('[DEBUG] Email sent successfully');

    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('[ERROR] Forgot Password Failure:', error);
    res.status(500).json({ message: 'Failed to send OTP. ' + error.message });
  }
});


// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const admin = await Admin.findByEmail(email);

    if (!admin || admin.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > new Date(admin.otpExpiry)) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const admin = await Admin.findByEmail(email);

    if (!admin || admin.otp !== otp) {
      return res.status(400).json({ message: 'Invalid or expired session' });
    }

    if (new Date() > new Date(admin.otpExpiry)) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await Admin.updatePassword(email, passwordHash);
    await Admin.clearOTP(email);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
