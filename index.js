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


import authRoutes from "./routes/auth.js";
// import connectToMongoDB from "./connect_mongodb.js";

connectToMongoDB();
app.use("/api/auth", authRoutes);

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
    // host: "127.0.0.1",
    host: "34.47.189.67",
    port: 6379,
    connectTimeout: 5000,     //  equivalent to socket_connect_timeout
    timeout: 5000             //  equivalent to socket_timeout
  },
  password: process.env.REDIS_PASS || ""
});



const startServer = async () => {
  await redisClient.connect();
  console.log("✅ Connected to Redis");

    // start server
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

  // post
  app.post("/api/sms", async (req, res) => {


    const { sender, receiver, message } = req.body;
    console.log(sender,receiver,message);

    if (!sender || !receiver || !message) {
      return res.status(400).json({ success: false, error: "Sender, receiver, and message are required" });
    }

    try {
      const id = uuidv4();
      const smsData = {
        id,
        sender,
        receiver,
        message,
        timestamp: new Date().toISOString()
      };

      // Store with TTL = 2 hours
      await redisClient.setEx(`sms:${id}`, 7200, JSON.stringify(smsData));

      res.status(201).json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });



  // app.get("/api/sms", async (req, res) => {
  //   try {
  //     const page = parseInt(req.query.page) || 1;       // Default to page 1
  //     const limit = parseInt(req.query.limit) || 10;    // Default to 10 items per page
  //     const start = (page - 1) * limit;
  //     const end = start + limit - 1;

  //     const keys = await redisClient.keys("sms:*");
  //     const sortedKeys = keys.sort(); // optional: sort keys (you may want to sort by timestamp if available)

  //     const pageKeys = sortedKeys.slice(start, end + 1);
  //     const smsList = [];

  //     for (const key of pageKeys) {
  //       const data = await redisClient.get(key);
  //       if (data) {
  //         smsList.push(JSON.parse(data));
  //       }
  //     }

  //     res.json({
  //       page,
  //       limit,
  //       total: keys.length,
  //       messages: smsList
  //     });
  //   } catch (err) {
  //     res.status(500).json({ success: false, error: err.message });
  //   }
  // });

  app.get("/api/sms", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const senderFilter = (req.query.sender || "").toLowerCase();
    const receiverFilter = (req.query.receiver || "").toLowerCase();
    const messageFilter = (req.query.message || "").toLowerCase();
    // console.log(page,limit,senderFilter,receiverFilter,messageFilter)

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const keys = await redisClient.keys("sms:*");
    const sortedKeys = keys.sort();

    const matchedSmsList = [];

    for (const key of sortedKeys) {
      const data = await redisClient.get(key);
      if (data) {
        const sms = JSON.parse(data);
        const senderMatch = sms.sender.toLowerCase().includes(senderFilter);
        const receiverMatch = sms.receiver.toLowerCase().includes(receiverFilter);
        const messageMatch = sms.message.toLowerCase().includes(messageFilter);

        if (senderMatch && receiverMatch && messageMatch) {
          matchedSmsList.push(sms);
        }
      }
    }

    const paginated = matchedSmsList.slice(start, end + 1);

    res.json({
      page,
      limit,
      total: matchedSmsList.length,
      messages: paginated,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});





startServer();



// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
