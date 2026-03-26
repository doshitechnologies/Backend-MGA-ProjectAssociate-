const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); // Import the crypto module
const User = require("../models/User");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../config/email");
const { validationResult } = require("express-validator");

// Generate a random verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate a random reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex"); // 32 bytes, returns a hex string
};

// Signup function
// const signup = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const { name, email, dob, phone, familyPhoneNumber, password, address } =
//       req.body;

//     // Check if a VERIFIED user already exists with this email/phone
//     const existingUserEmail = await User.findOne({
//       email,
//       deleted: false,
//       isVerified: true, // Only block if already verified
//     });

//     const existingUserPhone = await User.findOne({
//       phone,
//       deleted: false,
//       isVerified: true, // Only block if already verified
//     });

//     if (existingUserEmail) {
//       return res.status(400).json({ message: "Email already registered" });
//     }
//     if (existingUserPhone) {
//       return res.status(400).json({ message: "Phone already registered" });
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const verificationCode = generateVerificationCode();

//     // Log the generated verification code for debugging
//     console.log(
//       `Generated verification code for ${email}: ${verificationCode}`,
//     );

//     // Check if an unverified user already exists with this email
//     const unverifiedUser = await User.findOne({ email, isVerified: false });

//     let user;

//     if (unverifiedUser) {
//       // Reuse the existing unverified record — update with fresh data & OTP
//       unverifiedUser.name = name;
//       unverifiedUser.dob = dob;
//       unverifiedUser.phone = phone;
//       unverifiedUser.password = hashedPassword;
//       unverifiedUser.address = address;
//       unverifiedUser.verificationCode = verificationCode;
//       user = await unverifiedUser.save();
//     } else {
//       // Create a new user record
//       user = new User({
//         name,
//         email,
//         dob,
//         phone,
//         // familyPhoneNumber,
//         password: hashedPassword,
//         address,
//         verificationCode,
//         isVerified: false, // Explicitly set to false
//       });
//       await user.save();
//     }

//     // Attempt to send the verification email
//     try {
//       await sendVerificationEmail(email, name, phone, verificationCode);
//       console.log(`Verification email sent to ${email}`);
//     } catch (emailError) {
//       console.error(`Failed to send email: ${emailError.message}`);
//       // Rollback: delete the user if email fails on fresh signup
//       if (!unverifiedUser) {
//         await User.deleteOne({ _id: user._id });
//       }
//       return res
//         .status(500)
//         .json({ message: "Failed to send verification email" });
//     }

//     res.status(201).json({
//       message: "User registered successfully. Awaiting verification.",
//     });
//   } catch (error) {
//     console.error("Error during signup:", error.message);
//     res.status(500).json({ message: error.message });
//   }
// };
const signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, dob, phone, password, address } = req.body;

    // ✅ Single query to check both email and phone for verified users
    const existingUser = await User.findOne({
      deleted: false,
      isVerified: true,
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already registered" });
      }
      if (existingUser.phone === phone) {
        return res.status(400).json({ message: "Phone already registered" });
      }
    }

    // ✅ Hash password only after duplicate check passes
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();

    // ✅ OTP expiry — expires in 10 minutes
    const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // ✅ Remove console.log of OTP in production
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `Generated verification code for ${email}: ${verificationCode}`,
      );
    }

    // Check if unverified user already exists
    const unverifiedUser = await User.findOne({
      email,
      isVerified: false,
      deleted: false,
    });

    let user;

    if (unverifiedUser) {
      // ✅ Reuse existing unverified record — update with fresh data & new OTP
      unverifiedUser.name = name;
      unverifiedUser.dob = dob;
      unverifiedUser.phone = phone;
      unverifiedUser.password = hashedPassword;
      unverifiedUser.address = address;
      unverifiedUser.verificationCode = verificationCode;
      unverifiedUser.verificationCodeExpiry = verificationCodeExpiry; // ✅ Reset expiry
      user = await unverifiedUser.save();
    } else {
      // Create a new user record
      user = new User({
        name,
        email,
        dob,
        phone,
        password: hashedPassword,
        address,
        verificationCode,
        verificationCodeExpiry, // ✅ Store expiry
        isVerified: false,
      });
      await user.save();
    }

    // Attempt to send the verification email
    try {
      await sendVerificationEmail(email, name, phone, verificationCode);
      console.log(`Verification email sent to ${email}`);
    } catch (emailError) {
      console.error(`Failed to send email: ${emailError.message}`);
      // ✅ Rollback only for fresh signups
      if (!unverifiedUser) {
        await User.deleteOne({ _id: user._id });
      }
      return res
        .status(500)
        .json({ message: "Failed to send verification email" });
    }

    res.status(201).json({
      message: "User registered successfully. Awaiting verification.",
    });
  } catch (error) {
    console.error("Error during signup:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Improved verify controller
const verify = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res
        .status(400)
        .json({ message: "Email and verification code are required" });
    }

    // ✅ Exclude deleted users
    const user = await User.findOne({ email, deleted: false });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    // ✅ Check OTP expiry
    if (
      !user.verificationCodeExpiry ||
      user.verificationCodeExpiry < new Date()
    ) {
      return res.status(400).json({
        message:
          "Verification code has expired. Please signup again to get a new code",
      });
    }

    // ✅ Check OTP match
    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // ✅ Mark as verified and clear OTP fields
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    await user.save();

    res.status(200).json({ message: "User verified successfully" });
  } catch (error) {
    console.error("Error during verification:", error.message);
    res.status(500).json({ message: error.message });
  }
};
// Get users function
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -verificationCode"); // Exclude sensitive information
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const editUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, dob, phone, familyPhoneNumber, address } = req.body;

    // Find and update the user in the database
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email, dob, phone, familyPhoneNumber, address },
      { new: true, runValidators: true }, // Return the updated document and validate fields
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User edited successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify function
// const verify = async (req, res) => {
//   try {
//     const { email, verificationCode } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (user.verificationCode !== verificationCode) {
//       return res.status(400).json({ message: "Invalid verification code" });
//     }

//     user.isVerified = true;
//     user.verificationCode = undefined;
//     await user.save();

//     res.json({ message: "User verified successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// Forgot password function
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    const resetToken = generateResetToken(); // Call the generateResetToken function
    const resetTokenExpiry = new Date(Date.now() + 3600000); // Token valid for 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    const emailSent = await sendPasswordResetEmail(email, resetToken);

    if (!emailSent) {
      return res.status(500).json({
        message: "Error sending password reset email",
      });
    }

    res.json({
      message: "Password reset link has been sent to your email",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login function
const login = async (req, res) => {
  try {
    // ✅ Uncomment and use validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // ✅ Exclude deleted users
    const user = await User.findOne({ email, deleted: false });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({
        message: "Please verify your email before logging in",
      });
    }

    // ✅ Compare password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
      // ✅ 401 not 400, and vague message for security
    }

    // ✅ Sign token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Error during login:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    // ✅ Also exclude deleted users in reset password
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
      deleted: false, // ✅ added
      isVerified: true, // ✅ only verified users can reset password
    });

    if (!user) {
      return res.status(400).json({
        message: "Password reset token is invalid or has expired",
      });
    }

    // ✅ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Error during password reset:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, dob, phone, address } = req.body;

    // Find the user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found ketan" });
    }

    // Update fields if provided in request body
    if (name) user.name = name;
    if (dob) user.dob = dob;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();

    res.json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        dob: user.dob,
        phone: user.phone,
        address: user.address,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete user function
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete the user from the database
    const result = await User.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const forgetEmail = async (req, res) => {
  try {
    const { phone } = await req.body;
    const finduser = await User.find({ phone: phone }).select(
      "-password -verificationCode",
    );
    if (!finduser) {
      res.json({ message: "Email not found" }).status(404);
    }
    res.json({ message: finduser[0].email }).status(200);
  } catch (error) {
    res.json({ message: "Server Error" }).status(500);
  }
};

module.exports = {
  signup,
  verify,
  login,
  forgotPassword,
  resetPassword,
  getUsers,
  updateUser,
  editUser,
  deleteUser,
  forgetEmail,
};
