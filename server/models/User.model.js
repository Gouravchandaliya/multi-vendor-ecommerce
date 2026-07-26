const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,          // creates a unique index → 11000 error on duplicate
      lowercase: true,       // always stored in lowercase, so lookups are case-insensitive
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,         // NEVER returned in queries by default — must be explicit
    },
    role: {
      type: String,
      enum: {
        values: ['buyer', 'seller', 'admin'],
        message: 'Role must be buyer or seller',
      },
      default: 'buyer',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Stores the refresh token so we can invalidate it on logout
    refreshToken: {
      type: String,
      select: false,         // never expose this to the client
    },
  },
  {
    timestamps: true,        // adds createdAt and updatedAt automatically
  }
);

// ─── Pre-save hook: hash password ─────────────────────────────────────────────
/**
 * Only re-hash if the password field was actually modified.
 * Without this guard, saving other fields (e.g. refreshToken) would
 * re-hash an already-hashed password and break login.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance method: verify password ────────────────────────────────────────
/**
 * Compares a plain-text candidate with the stored bcrypt hash.
 * Used in the login controller.
 * Note: `this.password` is only available here because we explicitly
 * select it in the login query with `.select('+password')`.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Instance method: safe user object ────────────────────────────────────────
/**
 * Returns a plain object with sensitive fields removed.
 * Use this whenever returning user data to the client — never send the
 * raw document which might expose hashed password if someone forgets `select: false`.
 */
userSchema.methods.toSafeObject = function () {
  return {
    _id:       this._id,
    name:      this.name,
    email:     this.email,
    role:      this.role,
    isActive:  this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model('User', userSchema);
module.exports = User;
