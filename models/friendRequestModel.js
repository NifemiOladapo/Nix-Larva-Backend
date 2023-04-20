import mongoose from "mongoose";

const friendRequestSchema = mongoose.Schema({
  from: { type: mongoose.SchemaTypes.ObjectId, ref: "user" },
  to: { type: mongoose.SchemaTypes.ObjectId, ref: "user" },
  message: { type: String, required: true },
});

const FriendRequest = mongoose.model("friendRequest", friendRequestSchema);

export default FriendRequest;
