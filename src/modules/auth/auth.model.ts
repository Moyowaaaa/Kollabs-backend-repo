import mongoose, { Schema } from "mongoose";
import { IUserAuth, IUserAuthModel } from "./auth.interface";
import validator from "validator";
import bcrypt from "bcryptjs";

const usersSchema = new Schema<IUserAuth>({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  userProfile: {
    type: Schema.Types.ObjectId,
    ref: "UserProfile",
    required: false,
  },
  resetPasswordToken: {
    type: String,
    required: false,
  },
  resetPasswordExpires: {
    type: Date,
    required: false,
  },
});

//signup user
usersSchema.statics.signUpUser = async function (
  this: mongoose.Model<IUserAuth>,
  email: string,
  password: string
) {
  if (!email || !password) {
    throw new Error("Please enter a email and a password");
  }

  if (!validator.isEmail(email)) {
    throw new Error("Please use a valid email");
  }

  const existingUser = await this.findOne({ email });
  if (existingUser) {
    throw new Error("Email already in use, please try something else");
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const user = this.create({ email, password: hash });

  return user;
};

//login user
usersSchema.statics.loginUser = async function (
  this: mongoose.Model<IUserAuth>,
  email: string,
  password: string
) {
  if (!email || !password) {
    throw new Error("Please enter a email and a password");
  }

  if (!validator.isEmail(email)) {
    throw new Error("Please use a valid email");
  }

  const existingUser = await this.findOne({ email });
  if (!existingUser) {
    throw new Error("No user found with these credentials");
  }

  const matchPassword = await bcrypt.compare(password, existingUser.password);
  if (!matchPassword) {
    throw new Error("Incorrect Login credentials");
  }

  return existingUser;
};

//change password
usersSchema.statics.changePassword = async function (
  this: mongoose.Model<IUserAuth>,
  email: string,
  newPassword: string,
  currentPassword: string
) {
  if (!email) {
    throw new Error("Please enter an email");
  }

  if (!currentPassword) {
    throw new Error("Please enter your current password");
  }

  if (!newPassword) {
    throw new Error("Please enter a new password");
  }

  const user = await this.findOne({ email });
  if (!user) {
    throw new Error("We couldn't find a user with that email");
  }

  // Verify current password is correct
  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    user.password
  );
  if (!isCurrentPasswordValid) {
    throw new Error("Current password is incorrect");
  }

  // Check if new password is the same as current password
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new Error("New password cannot be the same as the old password");
  }

  // Hash the new password
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPassword, salt);

  // Update and save
  user.password = hash;
  await user.save();

  return user;
};

const userAuthModel = mongoose.model<IUserAuth, IUserAuthModel>(
  "User",
  usersSchema
);

export default userAuthModel;
