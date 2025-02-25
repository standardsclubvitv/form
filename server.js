import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";

// Load environment variables
dotenv.config();

// Validate env variable
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error("❌ Missing FIREBASE_SERVICE_ACCOUNT in .env");
    process.exit(1); // Stop server
}

// Parse Firebase credentials correctly
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Route to handle form submissions
app.post("/submit-form", async (req, res) => {
    try {
        const { name, regNo, email, gender, phone, pref1, pref2, pref3 } = req.body;

        if (!email.endsWith("@vitstudent.ac.in") && !email.endsWith("@vit.ac.in")) {
            return res.status(400).json({ error: "Invalid email domain. Use @vitstudent.ac.in or @vit.ac.in" });
        }

        const userRef = db.collection("domainDivision").doc(email);
        const docSnap = await userRef.get();

        if (docSnap.exists) {
            return res.status(400).json({ error: "You have already submitted the form!" });
        }

        await userRef.set({
            name,
            regNo,
            email,
            gender,
            phone,
            preferences: { pref1, pref2, pref3 },
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        return res.status(200).json({ message: "Form submitted successfully!" });

    } catch (error) {
        console.error("🔥 Error submitting form:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
