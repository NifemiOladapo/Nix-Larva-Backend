import mongoose from "mongoose";

const commentSchema = mongoose.Schema({
  author: { type: mongoose.SchemaTypes.ObjectId, ref: "user" },
  post: { type: mongoose.SchemaTypes.ObjectId, ref: "post" },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  content: { type: String, required: true },
  createdOn: { type: Date, default: Date.now() },
});

const Comment = mongoose.model("comment", commentSchema);

export default Comment;
