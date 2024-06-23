import mongoose from "mongoose";

const { Schema, model } = mongoose;

// Define the Project schema
const ProjectSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },
    id: {
        type: Number,
        required: true,
        unique: true,
    },
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
});

// Create the Project model
const Project = model("project", ProjectSchema);

// Export the model
export default Project;
