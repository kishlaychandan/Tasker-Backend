import dotenv from "dotenv";
import express from "express";
import connectToMongoDB from "./connect_mongodb.js";
import mongoose from "mongoose";

dotenv.config();
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

console.log("mongo....",process.env.MONGO_URL)

connectToMongoDB();

const smsSchema = new mongoose.Schema({
  sender: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});

const SMS = mongoose.model("SMS", smsSchema);

app.post("/api/sms", async (req, res) => {
  const { sender, message } = req.body;
  try {
    const sms = new SMS({ sender, message });
    await sms.save();
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
