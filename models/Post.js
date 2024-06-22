import mongoose from "mongoose";

const Schema = mongoose.Schema;
//https://www.udemy.com/course/mern-stack-front-to-back/learn/lecture/10055218#notes
//重要
const PostSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
    },
    text: {
        type: String,
        required: true,
    },
    name: {
        type: String,
    },
    avatar: {
        type: String,
    },
    likes: [
        {
            user: {
                type: Schema.Types.ObjectId,
            },
        },
    ],
    comments: [
        {
            user: {
                type: Schema.Types.ObjectId,
            },
            text: {
                type: String,
                required: true,
            },
            name: {
                type: String,
            },
            avatar: {
                type: String,
            },
            date: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    date: {
        type: Date,
        default: Date.now,
    },
});

const Post = mongoose.model("post", PostSchema);

export default Post;
