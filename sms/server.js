import express from "express";
import bodyParser from "body-parser";
import axios from "axios"; // Add this import

const app = express();
app.use(bodyParser.json());

app.get("/", (req, res) => {
    console.log("✅ Root route hit");
    res.send("Server is live");
});

app.post("/api/sms/incoming", async (req, res) => {
    const { from, message } = req.body;
    console.log("Received SMS data:", req.body);

    if (!from || !message) {
        console.log("❌ Missing fields:", req.body);
        return res.status(200).json({ success: false, error: "Missing fields" });
    }

    console.log("📩 SMS Received:");
    console.log("From:", from);
    console.log("Message:", message);

    try {
        // 🚀 Call ML server for NLP processing
        console.log("🤖 Sending message to ML server for processing...");

        const mlResponse = await axios.post('http://localhost:5000/nlp', {
            text: message
        },);

        console.log("✅ ML Processing successful:", mlResponse.data);

        // You can store or use the extracted data here
        const extractedData = mlResponse.data.extracted_data;
        console.log("📊 Extracted Info:");
        console.log("- Farmer ID:", extractedData.farmer_id);
        console.log("- Herb ID:", extractedData.herb_id);
        console.log("- Herb Name:", extractedData.herb_name);
        console.log("- Quantity (grams):", extractedData.quantity_grams);

        res.status(200).json({
            success: true,
            error: null,
            ml_result: mlResponse.data
        });

    } catch (error) {
        console.error("❌ ML Server Error:", error.message);

        // Handle different error scenarios
        if (error.code === 'ECONNREFUSED') {
            console.error("🔴 ML Server is not running on port 5000");
        } else if (error.code === 'ETIMEDOUT') {
            console.error("⏰ ML Server request timed out");
        }

        // Still return success to SMS provider, but log the error
        res.status(200).json({
            success: true,
            error: "ML processing failed",
            ml_error: error.message
        });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
