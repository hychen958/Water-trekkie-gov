// import express from "express";
// import jwt from "jsonwebtoken";
// import { MongoClient } from "mongodb";
// import dotenv from "dotenv";

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware
// app.use(express.json());

// // MongoDB connection
// const client = new MongoClient(process.env.MONGO_URI);
// await client.connect();
// const db = client.db(process.env.DB_NAME || "WaterTrekkies");
// const usersCollection = db.collection("Users");

// // Authentication Middleware
// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers["authorization"];
//   if (!authHeader) {
//     return res.status(401).json({ error: "Unauthorized" });
//   }

//   const token = authHeader.split(" ")[1];
//   if (!token || token === "undefined") {
//     return res.status(401).json({ error: "Unauthorized" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     if (!decoded || !decoded.email) {
//       return res.status(403).json({ error: "Invalid token" });
//     }
//     req.user = decoded;
//     next();
//   } catch (error) {
//     console.error("JWT verification failed:", error);
//     return res.status(403).json({ error: "Invalid token" });
//   }
// };

// // GET User Route
// app.get("/user", authenticateToken, async (req, res) => {
//   try {
//     const user = await usersCollection.findOne(
//       { email: req.user.email },
//       { projection: { password: 0 } }
//     );
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }
//     res.status(200).json(user);
//   } catch (error) {
//     console.error("Fetch user error:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // PUT (Update User) Route
// app.put("/user", authenticateToken, async (req, res) => {
//   try {
//     const { _id, ...updateData } = req.body; // Remove `_id` to prevent immutable field updates

//     const filter = { email: req.user.email };
//     const updateDoc = { $set: updateData };
//     const result = await usersCollection.updateOne(filter, updateDoc);

//     if (result.modifiedCount === 0) {
//       return res.status(400).json({ error: "No changes made" });
//     }

//     const updatedUser = await usersCollection.findOne(
//       { email: req.user.email },
//       { projection: { password: 0 } }
//     );

//     res.status(200).json(updatedUser);
//   } catch (error) {
//     console.error("Update user error:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // Start server
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
