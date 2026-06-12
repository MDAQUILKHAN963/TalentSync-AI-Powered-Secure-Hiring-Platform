const User = require('../models/User');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Faculty = require('../models/Faculty');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { verifyCompanyRegistration } = require('../services/govVerificationService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Unified Registration (Student or Company)
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { 
      firstName, lastName, email, password, role,
      university, degree, year, // Student fields
      companyName, gstNumber, regId, hqAddress, // Company fields
      department, specialization // Faculty fields
    } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 1. Create User
    const userData = {
      firstName,
      lastName: lastName || '',
      email,
      password: hashedPassword,
      role: role || 'student'
    };

    const user = await User.create(userData);

    // 2. Create Profile based on role
    if (user.role === 'student') {
      await Student.create({
        user: user._id,
        university,
        degree,
        year,
        skills: []
      });
    } else if (user.role === 'company') {
      // Government registration verification:
      // CIN structure (MCA format) + GSTIN with official GSTN check-digit algorithm.
      // Uses a live registry API if configured, otherwise offline checksum validation.
      const verification = await verifyCompanyRegistration(regId, gstNumber);

      await Company.create({
        user: user._id,
        companyName: companyName || firstName,
        govRegId: (regId || '').toUpperCase().trim(),
        gstCin: (gstNumber || '').toUpperCase().trim(),
        location: hqAddress,
        verifiedStatus: verification.status,
        verificationReasons: verification.reasons
      });

      // Surface the verdict to the frontend
      res.locals.verification = verification;
    } else if (user.role === 'faculty') {
      await Faculty.create({
        user: user._id,
        university,
        department,
        specialization
      });
    }

    res.status(201).json({
      user: {
        _id: user._id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        role: user.role,
        ...(res.locals.verification ? {
          verified: res.locals.verification.status === 'verified',
          verificationReasons: res.locals.verification.reasons
        } : {})
      },
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ 
      message: 'Registration failed internal error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Change password (any logged-in user)
// @route   PUT /api/auth/password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user (any role)
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      let extraInfo = {};
      if (user.role === 'company') {
        const company = await Company.findOne({ user: user._id });
        extraInfo.verified = company.verifiedStatus === 'verified';
      }

      res.json({
        user: {
          _id: user._id,
          name: user.role === 'student' ? `${user.firstName} ${user.lastName}` : user.firstName,
          email: user.email,
          role: user.role,
          ...extraInfo
        },
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: error.message });
  }
};
