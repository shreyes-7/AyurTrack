import nodemailer from 'nodemailer';

export const sendMail = async (to, subject, html) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
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
        console.log("Email sent to", to);
    } catch (err) {
        console.error(" Failed to send email:", err);
        throw err;
    }
};
