const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
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
        type: Array,
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
        type: Array,
    },
});

module.exports = mongoose.model("project", ProjectSchema);
