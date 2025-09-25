app.get("/", (req, res) => {
    console.error("✅ Root route hit");
    res.send("Server is live");
});

app.post("/api/sms/incoming", (req, res) => {
    const { from, message } = req.body;
    console.error("Received SMS data:", req.body);
    if (!from || !message) {
        console.error("❌ Missing fields:", req.body);
        return res.status(200).json({ success: false, error: "Missing fields" });
    }

    console.error("📩 SMS Received:");
    console.error("From:", from);
    console.error("Message:", message);

    res.status(200).json({ success: true, error: null });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.error(`✅ Server running on port ${PORT}`));
