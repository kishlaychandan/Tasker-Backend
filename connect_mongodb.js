import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const connectToMongoDB = async () => {
  const mongoURI = `${process.env.MONGO_URI}${process.env.MONGO_DB_NAME}`; // Combine URI and DB name
  try {
    await mongoose.connect(mongoURI, {
      // useNewUrlParser: true
    });
    console.log("Connected to MongoDB successfully!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1); // Exit the process if the conne
  }
}
export default connectToMongoDB;