const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const fs = require('fs');
const Note = require("./models/Note");
const User = require("./models/User");
const cors = require('cors');

const app = express();
const port = 5073;

// Enable CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Image stuff
const multer = require('multer')
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Images')
  },
  filename: (req, file, cb) => {
    console.log(file)
    cb(null, Date.now() + path.extname(file.originalname))
  }
})
const upload = multer({storage: storage})

app.use(express.static('pages'));
app.use('/Images', express.static(path.join(__dirname, '..', 'Images')));

// AI API stuff
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: "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" });


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect("mongodb+srv://admin:adminPassword@notteed.ikk6zmi.mongodb.net/notteed?retryWrites=true&w=majority&appName=notteed")
  .then(() => console.log("✅ Successfully connected to MongoDB Atlas"))
  .catch((error) => console.error("❌ MongoDB connection error:", error));

// API endpoints
app.post('/api/getnote', async (req, res) => {
  const { id } = req.body;
  try {
    const note = await Note.findById(id);
    if (note) {
      res.status(200).json({ success: true, note });
    } else {
      res.status(404).json({ success: false, message: 'Note not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

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
  try {
    const { title, desc, email } = req.body;
    if (!title || !email) {
      return res.status(400).json({ success: false, message: "Title and email are required" });
    }

    const noteData = {
    title,
    desc,
    email
  };

  let note = await Note.create(noteData);
  res.status(200).json({ success: true, note });
  } catch (err) {
    console.error("Failed to add note:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/api/updatenote", upload.single('image'), async (req, res) => {
  const { id, title, desc } = req.body;

  let updatedNote = null;
  if (req.file) {
    const imagePath = '/Images/' + req.file.filename;
    updatedNote = await Note.findByIdAndUpdate(id, { title, desc, imagePath }, { new: true });
  }
  else
  {
    updatedNote = await Note.findByIdAndUpdate(id, { title, desc }, { new: true });
  }
  res.status(200).json({ success: true, note: updatedNote });
});

app.post("/api/deletenote", async (req, res) => {
  const { id } = req.body;
  await Note.findByIdAndDelete(id);
  res.status(200).json({ success: true, message: "Note deleted" });
});

app.post('/api/deleteimage', (req, res) => {
  const { path: imagePath } = req.body;

  if (!imagePath || typeof imagePath !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid path' });
  }

  const fileName = imagePath.split('/').pop();
  const fullPath = path.join(__dirname, '..', 'Images', fileName);

  fs.unlink(fullPath, (err) => {
    if (err) {
      console.error('Failed to delete image:', err);
      return res.status(500).json({ success: false, message: 'Failed to delete file', error: err.message });
    }
    return res.json({ success: true, message: 'Image deleted' });
  });
});

app.post("/api/summarise", async (req, res) => {
  const { text } = req.body;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Summarise the following text:\n\n${text}`,
        },
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 1,
      max_tokens: 1024,
      top_p: 1,
      stream: true,
    });

    let summary = "";

    for await (const chunk of chatCompletion) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        summary += delta;
      }
    }

    res.status(200).json({ success: true, summary });

  } catch (error) {
    console.error("❌ Error summarizing:", error);
    res.status(500).json({ success: false, message: "Failed to generate summary." });
  }
});

// Serve React frontend
app.use(express.static(path.join(__dirname, "../frontend/build")));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
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
