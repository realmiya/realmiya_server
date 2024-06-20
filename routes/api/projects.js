const express = require("express");
const router = express.Router();

// @route    POST api/projects
// @desc    test projects
// @access   Public

router.get("/", (req, res) => res.send("projects route ::))"));
module.exports = router;
