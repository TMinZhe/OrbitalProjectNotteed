const express = require("express");
const mongoose = require("mongoose");
const Note = require("./models/Note");
const User = require("./models/User");
const app = express();

const path = require('path')
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

const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: "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" });

app.use(express.static('pages'));
app.use('/Images', express.static(path.join(__dirname, 'Images')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = 3000;

mongoose
  .connect(
    "mongodb+srv://admin:adminPassword@notteed.ikk6zmi.mongodb.net/notteed?retryWrites=true&w=majority&appName=notteed"
  )
  .then(() => {
    console.log("✅ Successfully connected to MongoDB Atlas");
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
  });

//Endpoints to server the HTML
app.get("/", (req, res) => {
  res.sendFile("pages/index.html", { root: __dirname });
});

app.get("/login", (req, res) => {
  res.sendFile("pages/login.html", { root: __dirname });
});

app.get("/signup", (req, res) => {
  res.sendFile("pages/signup.html", { root: __dirname });
});

//Endpoints for APIs
app.post("/getnotes", async (req, res) => {
  let notes = await Note.find({ email: req.body.email });
  res.status(200).json({ success: true, notes });
});

app.post("/login", async (req, res) => {
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

app.post("/signup", async (req, res) => {
  const { userToken } = req.body;
  console.log(req.body);
  let user = await User.create(req.body);
  res.status(200).json({ success: true, user: user });
});

// app.post("/addnote", upload.single('image'), async (req, res) => {
//   const { userToken } = req.body;
//   let note = await Note.create(req.body);
//   res.status(200).json({ success: true, note });
  
// });

app.post("/addnote", upload.single('image'), async (req, res) => {
  const { title, desc, email } = req.body;

  const noteData = {
    title,
    desc,
    email
  };

  if (req.file) {
    noteData.imagePath = '/Images/' + req.file.filename; // relative path
  }

  let note = await Note.create(noteData);
  res.status(200).json({ success: true, note });
});

app.post("/updatenote", async (req, res) => {
  const { id, title, desc } = req.body;
  const updatedNote = await Note.findByIdAndUpdate(
    id,
    { title, desc },
    { new: true }
  );
  res.status(200).json({ success: true, note: updatedNote });
});

app.post("/deletenote", async (req, res) => {
  const { id } = req.body;
  await Note.findByIdAndDelete(id);
  res.status(200).json({ success: true, message: "Note deleted" });
});

app.post("/summarise", async (req, res) => {
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

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});
