const express = require("express");
const mongoose = require("mongoose");
const Note = require("./models/Note");
const User = require("./models/User");
const app = express();
app.use(express.static('pages'));
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

app.post("/addnote", async (req, res) => {
  const { userToken } = req.body;
  let note = await Note.create(req.body);
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

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});
