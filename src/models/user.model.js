const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false
    },
    systemUser: {
      type: Boolean,
      default: false,
      immutable: true,
      select: false
    }
  },
  { timestamps: true }
);

// ✅ Hash password before saving (NO next, NO error)
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ✅ Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ✅ Prevent model overwrite error (important with nodemon)
const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;