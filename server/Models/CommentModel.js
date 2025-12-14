//server/Models/CommentModel.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post:   { type: mongoose.Schema.Types.ObjectId, ref: 'Post', index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text:   { type: String, maxlength: 500 },
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
