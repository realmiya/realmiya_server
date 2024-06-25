import express from "express";
import connectDB from "./config/db.js";
import path from "path";

const app = express();
// Connect Database
connectDB();
app.get("/", (req, res) => res.send("api running"));

// Init Middleware
app.use(express.json());

// Define Routes
import usersRoute from "./routes/api/users.js";
// import projectsRoute from "./routes/api/projects.js";
import authRoute from "./routes/api/auth.js";
import profileRoute from "./routes/api/profiles.js";
import postsRoute from "./routes/api/posts.js";

app.use("/api/users", usersRoute);
// app.use("/api/projects", projectsRoute);
app.use("/api/auth", authRoute);
app.use("/api/profiles", profileRoute);
app.use("/api/posts", postsRoute);
// api url怎么设置的，就是在这个use的括号里面设置的
// // Serve static assets in production
// if (process.env.NODE_ENV === 'production') {
//   // Set static folder
//   app.use(express.static('client/build'));

//   app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
//   });
// }

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
