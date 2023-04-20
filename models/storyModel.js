import mongoose from "mongoose";

const storySchema = mongoose.Schema({
  author: { type: mongoose.SchemaTypes.ObjectId, ref: "user" },
  content: String,
  image: String,
  video: String,
  createdOn: { type: Date, default: Date.now() },
});

const Story = mongoose.model("story", storySchema);

export default Story;
