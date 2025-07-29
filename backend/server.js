const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const fs = require('fs');
const Note = require("./models/Note");
const User = require("./models/User");
const cors = require('cors');
const crypto = require('crypto');
const { customAlphabet } = require('nanoid');
const { createWorker } = require('tesseract.js');

// API keys
const { GROQ_API_KEY } = require('./apikey');

const app = express();
const port = 5073;

// To generate unique sharing link
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 16);

// Enable CORS to bridge frontend and backend
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
    const uploadDir = path.join(__dirname, '..', 'Images');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage
});

app.use(express.static('pages'));
app.use('/Images', express.static(path.join(__dirname, '..', 'Images'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
  }
}));

// AI API stuff
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: {GROQ_API_KEY} });

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect("mongodb+srv://admin:adminPassword@notteed.ikk6zmi.mongodb.net/notteed?retryWrites=true&w=majority&appName=notteed")
  .then(() => console.log("✅ Successfully connected to MongoDB Atlas"))
  .catch((error) => console.error("❌ MongoDB connection error:", error));

// API endpoints
// res.status definitions:
// 200 -> Successful request
// 400 -> Invalid data/request
// 500 -> Server error

// Gets a note using note ID 
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

// Gets all notes based on user
app.post("/api/getnotes", async (req, res) => {
  let notes = await Note.find({ email: req.body.email });
  res.status(200).json({ success: true, notes });
});

// Checks if user valid is login
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

// Adds new user into the database, then returns bool (success)
app.post("/api/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    let user = await User.create(req.body);
    res.status(200).json({ success: true, user: user });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ success: false, message: error.message || 'Signup failed' });
  }
});

// Adds a new note to the database
app.post("/api/addnote", async (req, res) => {
  try {
    const { title, email } = req.body;
    const linkId = await generateUniqueLinkId();
    if (!title || !email) {
      return res.status(400).json({ success: false, message: "Title and email are required" });
    }

    const noteData = {
    title,
    email,
    linkId
  };

  let note = await Note.create(noteData);
  res.status(200).json({ success: true, note });
  } catch (err) {
    console.error("Failed to add note:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Generate unique link ID when adding note
const generateUniqueLinkId = async () => {
  let linkId;
  let exists = true;

  while (exists) {
    linkId = nanoid();
    const existing = await Note.findOne({ linkId });
    exists = !!existing;
  }

  return linkId;
};

// Updates contents of the note using ID, content and canvas data
app.post("/api/updatenote", async (req, res) => {
  const { id, canvasData, title } = req.body;

  try {
    const updateData = {};

    if (canvasData)
    {
      updateData.canvasData = JSON.parse(canvasData);
    }

    if (title)
    {
      updateData.title = title;
    }

    const updatedNote = await Note.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json({ success: true, note: updatedNote });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ success: false, message: "Update failed" });
  }
});

// Deletes notes based on ID
app.post("/api/deletenote", async (req, res) => {
  const { id } = req.body;
  await Note.findByIdAndDelete(id);
  res.status(200).json({ success: true, message: "Note deleted" });
});

// Extracts text from image and sends to Groq API for summary
app.post('/api/summariseimage', async (req, res) => {
  const { image } = req.body;

  if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
    return res.status(400).json({ success: false, message: 'Invalid or missing image data.' });
  }

  try {
    const worker = await createWorker('eng', 1);

    const { data: { text } } = await worker.recognize(image);

    await worker.terminate();

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

    let summary = '';
    for await (const chunk of chatCompletion) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) summary += delta;
    }

    res.status(200).json({ success: true, summary });

  } catch (err) {
    console.error('❌ Error summarizing image:', err);
    res.status(500).json({ success: false, message: 'Summarization failed.' });
  }
});

// Checks for validity of email (if it exists)
app.post('/api/checkemail', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });

    if (user) {
      res.status(200).json({ success: true, exists: true, userId: user._id });
    } else {
      res.status(200).json({ success: true, exists: false });
    }
  } catch (err) {
    console.error('Error checking email:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Updates the sharing access (both public and private access)
app.post('/api/updatesharing', async (req, res) => {
  const { noteId, publicAccess, sharedAccess } = req.body;

  if (!noteId) {
    return res.status(400).json({ success: false, message: 'Missing note ID' });
  }

  try {
    const updateFields = {};

    if (publicAccess) {
      updateFields.publicAccess = {
        enabled: !!publicAccess.enabled,
        permission: publicAccess.permission === 'editor' ? 'editor' : 'viewer'
      };
    }

    if (sharedAccess?.users?.length > 0) {
      updateFields['sharedAccess.users'] = sharedAccess.users;
    } else if (sharedAccess) {
      updateFields['sharedAccess.users'] = [];
    }

    await Note.findByIdAndUpdate(noteId, { $set: updateFields });

    res.json({ success: true, message: 'Sharing settings updated successfully' });
  } catch (err) {
    console.error('Failed to update sharing:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Toggles the note's public accessibility
app.post('/api/setpublic', async (req, res) => {
  const { id, makePublic } = req.body;

  try {
    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ success: false, message: "Note not found" });

    note.publicAccess.enabled = makePublic;

    if (makePublic && !note.linkId) {
      note.linkId = crypto.randomBytes(8).toString('hex'); // Generates a unique 16-char ID
    }

    await note.save();

    res.json({ success: true, linkId: note.linkId });
  } catch (err) {
    console.error("Failed to update public setting:", err);
    res.status(500).json({ success: false });
  }
});

// Checks if the user is authorised to access the note and what kind of permissions they hold
app.post("/api/accessnote", async (req, res) => {
  const { linkId, userEmail } = req.body;

  try {
    const note = await Note.findOne({ linkId });
    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    const isAuthor = userEmail && note.email === userEmail;
    const isPublic = note.publicAccess?.enabled === true;
    const isPublicEditor = note.publicAccess?.permission === 'editor';

    const sharedEntry = Array.isArray(note.sharedAccess?.users)
      ? note.sharedAccess.users.find(entry => entry.email === userEmail)
      : null;

    const isShared = !!sharedEntry;
    const isSharedEditor = sharedEntry?.role === 'editor';

    const canView = isAuthor || isShared || isPublic;

    let permission = 'viewer';
    if (isAuthor) {
      permission = 'editor';
    } else if (isSharedEditor) {
      permission = 'editor';
    } else if (isPublic && isPublicEditor) {
      permission = 'editor';
    }

    if (canView) {
      return res.status(200).json({
        success: true,
        note,
        permission
      });
    } else {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

  } catch (err) {
    console.error("Failed to access note:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Removes user from the shared access list
app.post('/api/notes/:noteId/removeaccess', async (req, res) => {
  try {
    const { noteId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Missing email' });
    }

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    
    if (!note.sharedAccess || !Array.isArray(note.sharedAccess.users)) {
      return res.status(400).json({ success: false, message: 'Shared access data invalid' });
    }

    const originalLength = note.sharedAccess.users.length;
    note.sharedAccess.users = note.sharedAccess.users.filter(u => u.email !== email);

    if (note.sharedAccess.users.length === originalLength) {
      return res.status(404).json({ success: false, message: 'User not found in shared list' });
    }

    note.markModified('sharedAccess.users');
    await note.save();

    res.status(200).json({ success: true, message: 'User access removed' });
  } catch (err) {
    console.error('Error removing access:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Updates the user's role in the note
app.post('/api/notes/:noteId/updaterole', async (req, res) => {
  const { noteId } = req.params;
  const { email, role } = req.body;

  if (!email || !['viewer', 'editor'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid email or role' });
  }

  try {
    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

    if (!note.sharedAccess || !Array.isArray(note.sharedAccess.users)) {
      return res.status(400).json({ success: false, message: 'Shared access data invalid' });
    }

    const user = note.sharedAccess.users.find(u => u.email === email);
    if (!user) return res.status(404).json({ success: false, message: 'User not found in shared access list' });

    user.role = role;

    // Mark modified so Mongoose detects changes in nested array
    note.markModified('sharedAccess.users');
    await note.save();

    res.json({ success: true, message: 'User role updated', updatedUser: user });
  } catch (err) {
    console.error('Update Role Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
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
