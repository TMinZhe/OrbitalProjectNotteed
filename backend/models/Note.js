const mongoose = require('mongoose')

const noteSchema = new mongoose.Schema({
    title: {type: String, required: true},
    desc: {type: String, required: false},
    email: {type: String, required: true},
    imagePath: String,
}, {timestamps: true});

module.exports = mongoose.model('Note', noteSchema);