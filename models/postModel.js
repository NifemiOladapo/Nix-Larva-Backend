import mongoose from "mongoose";

const postSchema = mongoose.Schema({
  author: { type: mongoose.SchemaTypes.ObjectId, ref: "user" },
  content: { type: String },
  image: { type: String },
  video: { type: String },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  createdOn: { type: Date, default: Date.now() },
});

const Post = mongoose.model("post", postSchema);

export default Post;
