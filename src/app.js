import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

/***************************** MIDDLEWARES DECLERATIONS ****************************/

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" })); //limiting json data.
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

/***************************** IMPORTING ROUTES ****************************/

import userRoute from "./routes/user.route.js";
import tweetRoute from "./routes/tweet.route.js";
import videoRoute from "./routes/video.route.js";
import commentRoute from "./routes/comment.route.js";
import likeRoute from "./routes/like.route.js";
import subscriptionRoute from "./routes/subscription.route.js";
import playlistRoute from "./routes/playlist.route.js";
import healthCheckRoute from "./routes/healthcheck.route.js";

/***************************** ROUTES DECLERATIONS ****************************/

app.use("/api/v1/users", userRoute);
app.use("/api/v1/tweets", tweetRoute);
app.use("/api/v1/videos", videoRoute);
app.use("/api/v1/comments", commentRoute);
app.use("/api/v1/likes", likeRoute);
app.use("/api/v1/subscriptions", subscriptionRoute);
app.use("/api/v1/playlists", playlistRoute);
app.use("/api/v1/healthcheck", healthCheckRoute);

export default app;
