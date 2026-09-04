import mongoose from "mongoose";

const connectionDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      family: 4,
    }).then(() => {
    console.log("Connected to MongoDB");
    })} catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

export default connectionDB;