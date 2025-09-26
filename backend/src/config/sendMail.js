import nodemailer from "nodemailer";

export const sendMail = async (to, subject, html) => {
  try {
    // Check if email credentials are configured
    if (!process.env.PLATFORM_EMAIL || !process.env.PLATFORM_EMAIL_PASS) {
      console.log("⚠️ Email credentials not configured, skipping email send");
      console.log(`📧 Would have sent to: ${to}`);
      console.log(`📝 Subject: ${subject}`);
      return; // Don't throw error, just skip sending
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.PLATFORM_EMAIL,
        pass: process.env.PLATFORM_EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.PLATFORM_EMAIL,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully to", to);
  } catch (err) {
    console.error("❌ Failed to send email:", err.message);

    // Don't throw error to prevent user creation from failing
    if (err.message.includes("Invalid login")) {
      console.error(
        "💡 Tip: Make sure you're using an App-Specific Password for Gmail"
      );
    }
  }
};
