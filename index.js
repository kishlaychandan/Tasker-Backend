// import dotenv from "dotenv";
// import express from "express";
// import connectToMongoDB from "./connect_mongodb.js";
// import mongoose from "mongoose";
// import cors from 'cors';

// dotenv.config();
// const app = express();
// app.use(express.json());
// app.use(cors());
// const PORT = process.env.PORT || 3000;

// console.log("mongo....",process.env.MONGO_URL)

// connectToMongoDB();

// const smsSchema = new mongoose.Schema({
//   sender: String,
//   message: String,
//   timestamp: { type: Date, default: Date.now }
// });

// const SMS = mongoose.model("SMS", smsSchema);

// app.post("/api/sms", async (req, res) => {
//   const { sender, message } = req.body;
//   try {
//     const sms = new SMS({ sender, message });
//     await sms.save();
//     res.status(201).json({ success: true });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// app.get('/api/sms', async (req, res) => {
//   try {
//     const messages = await SMS.find().sort({ timestamp: -1 });
//     res.json(messages);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

import dotenv from "dotenv";
import express from "express";
import connectToMongoDB from "./connect_mongodb.js";
// import mongoose from "mongoose";
import cors from 'cors';
import { createClient } from "redis";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 3000;
import { v4 as uuidv4 } from "uuid"; // for unique message IDs

// console.log("mongo....",process.env.MONGO_URI)

// connectToMongoDB();

// const smsSchema = new mongoose.Schema({
//   sender: String,
//   message: String,
//   timestamp: { type: Date, default: Date.now }
// });

// const SMS = mongoose.model("SMS", smsSchema);

const redisClient = createClient({
  socket: {
    host: "34.47.189.67",
    port: 6379,
    connectTimeout: 5000,     //  equivalent to socket_connect_timeout
    timeout: 5000             //  equivalent to socket_timeout
  },
  password: process.env.REDIS_PASS
});



const startServer = async () => {
  await redisClient.connect();
  console.log("✅ Connected to Redis");


  // post
  app.post("/api/sms", async (req, res) => {
    const { sender, message } = req.body;

    if (!sender || !message) {
      return res.status(400).json({ success: false, error: "Sender and message are required" });
    }

    try {
      const id = uuidv4();
      const smsData = {
        id,
        sender,
        message,
        timestamp: new Date().toISOString()
      };

      // Store each SMS in a separate key with TTL = 7200 seconds (2 hours)
      await redisClient.setEx(`sms:${id}`, 7200, JSON.stringify(smsData));

      res.status(201).json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });


  // get
  app.get("/api/sms", async (req, res) => {
    try {
      const keys = await redisClient.keys("sms:*"); // get all keys
      const smsList = [];

      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          smsList.push(JSON.parse(data));
        }
      }

      res.json(smsList);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // start server
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();



// app.post("/api/sms", async (req, res) => {
//   const { sender, message } = req.body;
//   try {
//     const sms = new SMS({ sender, message });
//     await sms.save();
//     res.status(201).json({ success: true });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// app.get('/api/sms', async (req, res) => {
//   try {
//     const messages = await SMS.find().sort({ timestamp: -1 });
//     res.json(messages);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
