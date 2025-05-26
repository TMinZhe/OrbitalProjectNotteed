const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const Note = require("./models/Note");
const User = require("./models/User");
const cors = require('cors');

const app = express();
const port = 5073;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect("mongodb+srv://admin:adminPassword@notteed.ikk6zmi.mongodb.net/notteed?retryWrites=true&w=majority&appName=notteed")
  .then(() => console.log("✅ Successfully connected to MongoDB Atlas"))
  .catch((error) => console.error("❌ MongoDB connection error:", error));

// API endpoints
app.post("/api/getnotes", async (req, res) => {
  let notes = await Note.find({ email: req.body.email });
  res.status(200).json({ success: true, notes });
});

app.post("/api/login", async (req, res) => {
  let user = await User.findOne(req.body);
  if (!user) {
    res.status(200).json({ success: false, message: "No user found" });
  } else {
    res.status(200).json({
      success: true,
      user: { email: user.email },
      message: "User found",
    });
  }
});

app.post("/api/signup", async (req, res) => {
  try {
    let user = await User.create(req.body);
    res.status(200).json({ success: true, user: user });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ success: false, message: error.message || 'Signup failed' });
  }
});

app.post("/api/addnote", async (req, res) => {
  let note = await Note.create(req.body);
  res.status(200).json({ success: true, note });
});

app.post("/api/updatenote", async (req, res) => {
  const { id, title, desc } = req.body;
  const updatedNote = await Note.findByIdAndUpdate(id, { title, desc }, { new: true });
  res.status(200).json({ success: true, note: updatedNote });
});

app.post("/api/deletenote", async (req, res) => {
  const { id } = req.body;
  await Note.findByIdAndDelete(id);
  res.status(200).json({ success: true, message: "Note deleted" });
});

// Serve React frontend
app.use(express.static(path.join(__dirname, "../client/build")));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
