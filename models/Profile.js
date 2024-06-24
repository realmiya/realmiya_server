import mongoose from "mongoose";
const { Schema, model } = mongoose;
const ProfileSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },
    company: {
        type: String,
    },
    website: {
        type: String,
    },
    location: {
        type: String,
    },
    status: {
        type: String,
        required: true,
    },
    skills: {
        type: [String], //这是array
        required: true,
    },
    bio: {
        type: String,
    },
    githubusername: {
        type: String,
    },
    experience: [
        {
            employer: {
                type: String,
                required: true,
            },
            jobTitle: {
                type: String,
                required: true,
            },
            jobDuty: {
                type: [String],
            },
            period: {
                type: String,
            },
            location: {
                type: String,
            },
            from: {
                type: Date,
                required: true,
            },
            to: {
                type: Date,
            },
            current: {
                type: Boolean,
                default: false,
            },
        },
    ],
    project: [
        {
            project_name: {
                type: String,
                required: true,
            },
            time_period: {
                type: String,
                required: true,
            },
            stack: {
                type: [String], // Specify that stack should be an array of strings
            },
            description: {
                type: String,
                required: true,
            },
            website_link1: {
                type: String,
            },
            website_link2: {
                type: String,
            },
            my_duty: {
                type: [String], // Specify that my_duty should be an array of strings
            },
            current: {
                type: Boolean,
                default: false,
            },
        },
    ],
    education: [
        {
            school: {
                type: String,
                required: true,
            },
            degree: {
                type: String,
                required: true,
            },
            fieldofstudy: {
                type: String,
                required: true,
            },
            from: {
                type: Date,
                required: true,
            },
            to: {
                type: Date,
            },
            current: {
                type: Boolean,
                default: false,
            },
            description: {
                type: [String],
            },
        },
    ],
    social: {
        youtube: {
            type: String,
        },
        twitter: {
            type: String,
        },
        facebook: {
            type: String,
        },
        linkedin: {
            type: String,
        },
        instagram: {
            type: String,
        },
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

const Profile = model("profile", ProfileSchema);

export default Profile;
