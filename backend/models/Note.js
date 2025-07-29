const mongoose = require('mongoose')

const noteSchema = new mongoose.Schema({
    title: {type: String, required: true},
    email: {type: String, required: true}, // Owner
    canvasData: {
        lines: Array,
        textBoxes: Array,
        images: Array,
    },
    linkId: {
    type: String,
    unique: true,
    sparse: true // Allows some docs to omit it
    },
    publicAccess: {
        enabled: { type: Boolean, default: false },
        permission: {
        type: String,
        enum: ['viewer', 'editor'],
        default: 'viewer',
        }
    },
    sharedAccess: {
        users: [{
        email: { type: String, required: true },
        role: { type: String, enum: ['viewer', 'editor'], default: 'viewer' }
        }]
    }
}, {timestamps: true});

module.exports = mongoose.model('Note', noteSchema);