import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import connectDB from "./db.js";
import User from "./models/userModel.js";
import generateToken from "./generateToken.js";
import protect from "./authMiddleware.js";
import Comment from "./models/commentModel.js";
import FriendRequest from "./models/friendRequestModel.js";
import Post from "./models/postModel.js";
import Story from "./models/storyModel.js";
import mongoose from "mongoose";

const app = express();
connectDB();

app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("App is running");
});

app.get("/api/users", async (req, res) => {
  const users = await User.find()
    .populate("friends", "-password")
    .select("-password");

  res.status(200).json(users);
});

app.post("/api/register", async (req, res) => {
  const { username, email, password, profilePicture } = req.body;

  if (!username || !email || !password) {
    return res.json("input all the neccessary fields");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json("This email is already in use");
  }

  try {
    const user = await User.create({
      username,
      email,
      password,
      profilePicture,
      isOnline: true,
    });

    if (user) {
      res.status(200).json({
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        friends: user.friends,
        createdOn: user.createdOn,
        _id: user._id,
        isOnline: user.isOnline,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json("User not created");
    }
  } catch (err) {
    console.log(err.message);
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json("input all the neccessary fields");
  }

  try {
    const user = await User.findOne({ email, password });

    if (user) {
      user.isOnline = true;
      user.save();
      res.status(200).json({
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        friends: user.friends,
        createdOn: user.createdOn,
        _id: user._id,
        isOnline: user.isOnline,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json("Could not find this account");
    }
  } catch (error) {
    console.log(error.message);
  }
});

app.put("/api/updateprofile", protect, async (req, res) => {
  const { newUsername, newProfilePicture } = req.body;

  if (!newUsername && !newProfilePicture) {
    return res.json("input all neccessary fields");
  }

  //this mean a user is trying to update both his/her profile picture and username

  if (newUsername !== "" && newProfilePicture !== "") {
    try {
      const updatedProfile = await User.findByIdAndUpdate(
        req.loggeduser._id,
        {
          username: newUsername,
          profilePicture: newProfilePicture,
        },
        { new: true }
      );

      if (updatedProfile) {
        res.status(200).json(updatedProfile);
      } else {
        res.status(400).json("could not upadate this account");
      }
    } catch (error) {
      console.log(error.message);
    }
  }

  //this mean a user is trying to update only his/her username and not picture

  if (newUsername !== "" && newProfilePicture === "") {
    try {
      const updatedProfile = await User.findByIdAndUpdate(
        req.loggeduser._id,
        {
          username: newUsername,
        },
        { new: true }
      );

      if (updatedProfile) {
        res.status(200).json(updatedProfile);
      } else {
        res.status(400).json("could not upadate this account");
      }
    } catch (error) {
      console.log(error.message);
    }
  }

  //thuis mean a user is trying to update only his/her profile picture and not username

  if (newUsername === "" && newProfilePicture !== "") {
    try {
      const updatedProfile = await User.findByIdAndUpdate(
        req.loggeduser._id,
        {
          profilePicture: newProfilePicture,
        },
        { new: true }
      );

      if (updatedProfile) {
        res.status(200).json(updatedProfile);
      } else {
        res.status(400).json("could not upadate this account");
      }
    } catch (error) {
      console.log(error.message);
    }
  }
});

app.delete("/api/deleteaccount", protect, async (req, res) => {
  const deleted = await User.findByIdAndDelete(req.loggeduser._id);
  if (deleted) {
    await Post.deleteMany({ author: deleted._id });
    res.json(deleted);
  } else {
    res.json("could not delete account");
  }
});

app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find().populate("author", "-password");

    if (posts) {
      res.status(200).json(posts);
    } else {
      res.status(400).json("could not fetch posts");
    }
  } catch (err) {
    console.log(err.messgae);
  }
});

app.post("/api/uploadpost", protect, async (req, res) => {
  const { content, image, video } = req.body;

  if (!content && !image && !video) {
    return res.json("Input all the neede fields");
  }

  try {
    const post = await Post.create({
      author: req.loggeduser._id,
      content,
      image,
      video,
    }).then((res) => {
      return res.populate("author", "-password");
    });

    if (post) {
      res.status(200).json(post);
      // console.log("hi");
      // setTimeout(() => {
      //   const deletedPost = Post.findByIdAndDelete(post._id);
      //   console.log(deletedPost);
      // }, 8000);
    } else {
      res.status(400).json("could not create this post");
    }
  } catch (err) {
    console.log(err.message);
  }
});

app.put("/api/likepost", async (req, res) => {
  const { postId } = req.body;

  try {
    const post = await Post.findById(postId);
    post.likes++;
    post.save();

    res.status(200).json(post);
  } catch (error) {
    console.log(error.message);
  }
});

app.put("/api/dislikepost", async (req, res) => {
  const { postId } = req.body;

  try {
    const post = await Post.findById(postId);
    if (post.likes > 0) {
      post.dislikes++;
      post.save();

      res.status(200).json(post);
    } else {
      res.json(post.likes);
    }
  } catch (error) {
    console.log(error.message);
  }
});

app.delete("/api/deletepost", protect, async (req, res) => {
  const { postId } = req.body;

  const findPost = await Post.findById(postId).populate("author", "-password");

  if (findPost.author._id.toString() !== req.loggeduser._id.toString()) {
    return res
      .status(400)
      .json("Only the person who creates a post can delete it");
  }

  const post = await Post.findByIdAndDelete(postId);

  if (post) {
    await Comment.deleteMany({ post: post._id });
    res.status(200).json(post);
  } else {
    res.status(400).json("could not delete this post");
  }
});

app.post("/api/commenttopost", protect, async (req, res) => {
  const { content, postId } = req.body;

  if (!content) {
    return res.json("Input all the necccessary fields");
  }

  try {
    const comment = await Comment.create({
      author: req.loggeduser._id,
      content,
      post: postId,
    }).then((res) =>
      res.populate("author", "-password").then((res) => res.populate("post"))
    );

    if (comment) {
      res.status(200).json(comment);
    } else {
      res.status(400).json("could not comment to this post");
    }
  } catch (err) {
    console.log(err.message);
  }
});

app.get("/api/getcomments", async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.query.postId })
      .populate("author", "-password")
      .populate("post");

    if (comments) {
      res.status(200).json(comments);
    } else {
      res.status(400).json("could not fetch comments");
    }
  } catch (err) {
    console.log(err.message);
  }
});

app.put("/api/likecomment", async (req, res) => {
  const { commentId } = req.body;

  const comment = await Comment.findById(commentId);

  comment.likes++;
  comment.save();

  res.status(200).json(comment);
});

app.put("/api/dislikecomment", async (req, res) => {
  const { commentId } = req.body;

  const comment = await Comment.findById(commentId);

  if (comment.likes > 0) {
    comment.dislikes++;
    comment.save();

    res.status(200).json(comment);
  } else {
    res.json(comment.likes);
  }
});

app.post("/api/sendfriendrequest", protect, async (req, res) => {
  const { message, toId } = req.body;

  if (!message) {
    return res.json("input your introductory message");
  }

  //this will check if there is an existing friend request between the two users.
  const existingFriendRequest = await FriendRequest.findOne({
    from: req.loggeduser._id,
    to: toId,
  });
  if (existingFriendRequest) {
    return res.json("You have an existing friend request");
  }

  try {
    const friendRequest = await FriendRequest.create({
      from: req.loggeduser._id,
      to: toId,
      message: message,
    }).then((res) =>
      res
        .populate("from", "-password")
        .then((res) => res.populate("to", "-password"))
    );

    if (friendRequest) {
      res.status(200).json(friendRequest);
    } else {
      res.status(400).json("Could not send friend request");
    }
  } catch (error) {
    console.log(error.message);
  }
});

app.get("/api/sentfriendrequests", protect, async (req, res) => {
  const friendRequests = await FriendRequest.find({
    from: req.loggeduser._id,
  })
    .populate("from", "-password")
    .populate("to", "-password");

  if (friendRequests.length < 1) {
    return res.json("You have no friend requests");
  }

  if (friendRequests) {
    res.status(200).json(friendRequests);
  } else {
    res.status(400).json("could not fetch your friend requests");
  }
});

app.get("/api/recievedfriendrequests", protect, async (req, res) => {
  const friendRequests = await FriendRequest.find({
    to: req.loggeduser._id,
  })
    .populate("from", "-password")
    .populate("to", "-password");

  if (friendRequests.length < 1) {
    return res.json("You have no friend requests");
  }

  if (friendRequests) {
    res.status(200).json(friendRequests);
  } else {
    res.status(400).json("could not fetch your friend requests");
  }
});

app.post("/api/acceptfriendrequest", protect, async (req, res) => {
  const { friendRequestId } = req.body;

  try {
    const friendRequest = await FriendRequest.findById(friendRequestId);

    if (friendRequest === null) {
      return res.status(400).json("This friend request does not exist");
    }

    await User.findByIdAndUpdate(
      friendRequest.from,
      {
        $push: { friends: friendRequest.to },
      },
      { new: true }
    );
    await User.findByIdAndUpdate(
      friendRequest.to,
      {
        $push: { friends: friendRequest.from },
      },
      { new: true }
    );

    const user = await User.findById(req.loggeduser._id).populate(
      "friends",
      "-password"
    );

    if (user) {
      res.status(200).json(user);
      await FriendRequest.findByIdAndDelete(friendRequest._id);
    } else {
      res.status(400).json("could not accept friend request");
    }
  } catch (error) {
    console.log(error.message);
  }
});

app.get("/api/searchusers", protect, async (req, res) => {
  const { query } = req.query;
  const users = await User.find({
    $and: [
      { username: { $regex: query, $options: "i" } },
      { _id: { $ne: req.loggeduser._id } },
    ],
  }).select("-password");

  if (users.length < 1) {
    return res.json("No users found");
  }
  res.status(200).json(users);
});

app.get("/api/getauserposts", async (req, res) => {
  const { userId } = req.query;
  const posts = await Post.find({
    author: userId,
  });
  if (posts.length < 1) {
    return res.json("This user has not uploaded any post yet");
  }
  res.status(200).json(posts);
});

app.post("/api/uploadstory", protect, async (req, res) => {
  const { content, video, image } = req.body;

  if (!content && !video && !image) {
    return res.json("Please input the needed fields");
  }

  const story = await Story.create({
    content,
    image,
    video,
    author: req.loggeduser._id,
  }).then((res) => res.populate("author", "-password"));
  if (story) {
    res.status(200).json(story);
  }
});

app.get("/api/stories", protect, async (req, res) => {
  const user = await User.findById(req.loggeduser._id).populate("friends");

  const stories = await Story.find({
    author: { $in: user.friends },
  }).populate("author", "-password");

  if (stories.length < 1) {
    return res.json("No Story");
  }

  if (stories) {
    res.status(200).json(stories);
  } else {
    res.status(400).json("Could not find any stories");
  }
});

app.post("/api/logout", protect, async (req, res) => {
  const user = await User.findById(req.loggeduser._id);
  if (user) {
    user.isOnline = false;
    user.save();
    res.json(user);
  }
});

app.listen(3005, () => {
  console.log("app is running");
});
