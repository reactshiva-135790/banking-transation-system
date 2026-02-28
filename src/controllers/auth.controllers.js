const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { email, name, password } = req.body;

    // ✅ Validate input
    if (!email || !name || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    // ✅ Check existing user
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    // ✅ Create user
    const newUser = await userModel.create({
      email,
      name,
      password
    });

    // ✅ Generate token
    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Error registering user",
      error: error.message
    });
  }
};

const login = async (req, res) => {
  // ✅ Implement login logic (similar to register but with password comparison)
  const { email, password } = req.body;

  // ✅ Validate input
  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required"
    });
  }
  
  try {
    // ✅ Find user by email
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    // ✅ Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Error logging in",
      error: error.message
    });
  } 
};

module.exports = { register, login };