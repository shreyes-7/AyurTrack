import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

app.post("/api/sms/incoming", (req, res) => {
    const { from, message } = req.body;
    console.log("Received SMS data:", req.body);
    if (!from || !message) {
        console.log("❌ Missing fields:", req.body);
        return res.status(200).json({ success: false, error: "Missing fields" });
    }

    console.log("📩 SMS Received:");
    console.log("From:", from);
    console.log("Message:", message);

    res.status(200).json({ success: true, error: null });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
