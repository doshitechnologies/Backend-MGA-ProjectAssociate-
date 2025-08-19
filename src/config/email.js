const nodemailer = require("nodemailer");

// Create transporter function that gets called when needed
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send verification email (to Admin)
 */
const sendVerificationEmail = async (email, name, phone, verificationCode) => {
  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `"Doshi Technologies" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "New User Verification Code",
      text: `New user registration details:
       Name: ${name}
       Email: ${email}
       Phone: ${phone}
       Verification Code: ${verificationCode}`,
    });

    console.log("Verification email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Email sending error (verification):", error.message);
    return false;
  }
};

/**
 * Send password reset email (to User)
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = createTransporter();

    const resetLink = `https://www.mga2002.in/resetpassword?token=${resetToken}`;

    const info = await transporter.sendMail({
      from: `"Doshi Technologies" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your account.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetLink}" target="_blank">${resetLink}</a></p>
        <p>This link will expire in <b>1 hour</b>.</p>
        <p>If you didn't request this reset, please ignore this email.</p>
        <hr/>
        <small>For security reasons, please do not share this link with anyone.</small>
      `,
    });

    console.log("Password reset email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Password reset email sending error:", error.message);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
