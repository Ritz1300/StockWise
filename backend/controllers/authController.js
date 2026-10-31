const User = require("../models/User");
const Store = require("../models/Store");
const { generateToken, successResponse } = require("../utils/helpers");

// @POST /api/v1/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, storeName } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }
    // Create store for owner, or require store for others
    let store;
    if (role === "owner" || !req.body.storeId) {
      store = await Store.create({ name: storeName || `${name}'s Store` });
    } else {
      store = await Store.findById(req.body.storeId);
      if (!store) return res.status(400).json({ success: false, message: "Store not found" });
    }
    const user = await User.create({ name, email, password, role: role || "owner", store: store._id });
    const token = generateToken(user._id);
    return successResponse(res, { token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, store } }, "Registration successful", 201);
  } catch (err) {
    next(err);
  }
};

// @POST /api/v1/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    const user = await User.findOne({ email }).select("+password").populate("store");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: "Account is inactive" });
    }
    const token = generateToken(user._id);
    return successResponse(res, {
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, store: user.store },
    }, "Login successful");
  } catch (err) {
    next(err);
  }
};

// @GET /api/v1/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("store");
    return successResponse(res, { user: { _id: user._id, name: user.name, email: user.email, role: user.role, store: user.store } });
  } catch (err) {
    next(err);
  }
};

// @PUT /api/v1/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, email }, { new: true, runValidators: true }).populate("store");
    return successResponse(res, { user: { _id: user._id, name: user.name, email: user.email, role: user.role, store: user.store } }, "Profile updated");
  } catch (err) {
    next(err);
  }
};

// @PUT /api/v1/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }
    user.password = newPassword;
    await user.save();
    return successResponse(res, {}, "Password changed successfully");
  } catch (err) {
    next(err);
  }
};
