import express from "express";
import axios from "axios";
import config from "config";
import { Router } from "express";
import auth from "../../middleware/auth.js";
import { check, validationResult } from "express-validator";
import checkObjectId from "../../middleware/checkObjectId.js";

import Profile from "../../models/Profile.js";
import User from "../../models/User.js";
import Post from "../../models/Post.js";
import normalizeUrl from "normalize-url";
import moment from "moment";

const router = Router();

// @route    GET api/profile/me  //me is current user
// @desc     Get current users profile
// @access   Private
router.get("/me", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.user.id,
            // 为什么你可以用req.user.id to access the ID of the currently authenticated user?
            // 因为the auth middleware populates req.user with the user's information,查看middleware/auth.js
            //  typically by verifying a JSON Web Token (JWT) sent with the request.
        }).populate("user", ["name", "avatar"]); //这里的意思是用('user', ['name', 'avatar'])populate你get的response，aka当前用jwt里面解析出来的current user
        // Selects Specific Fields: Only the name and avatar fields from the User document are included in the final result. Other fields like email or password are excluded.
        // 这个设置就这样，还记得那个死胖子的头像出来了吗
        if (!profile) {
            return res
                .status(400)
                .json({ msg: "There is no profile for this user" });
        }

        res.json(profile); //把拿到的profile发给res的意思
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route    POST api/profile
// @desc     Create or update user profile
// @access   Private
router.post(
    "/",
    auth,
    // Validation rules
    check("status", "Status is required").notEmpty(),
    check("skills", "Skills is required").notEmpty(),
    async (req, res) => {
        // Gather validation results
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        //当req合法的时候，要发回res，现在开始写res该是怎么样
        //首先从req。body里面分解出下面这么多东西
        // destructure the request
        const {
            website,
            skills,
            youtube,
            twitter,
            instagram,
            linkedin,
            facebook,
            // spread the rest of the fields we don't need to check
            //maybe need to add company
            ...rest
        } = req.body;

        // build a profileFields object
        const profileFields = {
            user: req.user.id,
            website:
                website && website !== ""
                    ? normalizeUrl(website, { forceHttps: true })
                    : "",
            skills: Array.isArray(skills)
                ? skills
                : skills.split(",").map((skill) => " " + skill.trim()),
            ...rest,
        };

        // Build socialFields object
        const socialFields = {
            youtube,
            twitter,
            instagram,
            linkedin,
            facebook,
        };

        // normalizeUrl social fields to ensure valid url
        for (const [key, value] of Object.entries(socialFields)) {
            if (value && value.length > 0)
                socialFields[key] = normalizeUrl(value, { forceHttps: true });
            // 以下是该函数可能执行的操作的一个示例normalizeUrl：
            // 输入网址：http://example.com
            // 规范化 URL 为forceHttps: true：https://example.com
        }
        // add to profileFields
        profileFields.social = socialFields;
        //above is clean process data, now data is clean, we can do try and catch
        try {
            // Using upsert option (creates new doc if no match is found):
            let profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields }, //一个tips，$set在 MongoDB 中用于在更新操作中指定字段及其新值。
                // $set: profileFields确保只有 中指定的字段才会在标识的用户的文档profileFields中更新，同时保留文档中未包含在 中的任何其他现有字段。这种方法允许在 MongoDB 中进行更可控和更有针对性的更新。
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
            // upsert 更新插入
            // { new: true }: Returns the modified document rather than the original.
            // { upsert: true }: Creates a new document if no match is found.
            // { setDefaultsOnInsert: true }: When upserting, applies the default values of the schema if a new document is created.

            return res.json(profile);
        } catch (err) {
            console.error(err.message);
            return res.status(500).send("Server Error");
        }
    }
);

// @route    GET api/profiles
// @desc     Get all profiles
// @access   Public
router.get("/", async (req, res) => {
    try {
        const profiles = await Profile.find().populate("user", [
            "name",
            "avatar",
        ]);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route    GET api/profile/user/:user_id
// @desc     Get profile by user ID
// @access   Public
router.get(
    "/user/:user_id",
    checkObjectId("user_id"),
    async ({ params: { user_id } }, res) => {
        try {
            const profile = await Profile.findOne({
                user: user_id,
            }).populate("user", ["name", "avatar"]);

            if (!profile)
                return res.status(400).json({ msg: "Profile not found" });

            return res.json(profile);
        } catch (err) {
            console.error(err.message);
            return res.status(500).json({ msg: "Server error" });
        }
    }
);

// @route    DELETE api/profile
// @desc     Delete profile, user & posts,这个操作慎用，仅做演示本人，aka当前用户，想消失，他如何同时删掉profile, user & posts
// @access   Private
router.delete("/", auth, async (req, res) => {
    try {
        await Promise.all([
            Post.deleteMany({ user: req.user.id }), // Remove user posts
            //req.user.id从当前用户的token中来
            Profile.findOneAndRemove({ user: req.user.id }), // Remove profile
            User.findOneAndRemove({ _id: req.user.id }), // Remove user
        ]);
        res.json({ msg: "User deleted" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});
// Function to compare dates and render the result as a string
function compareDates(date1, date2) {
    const fromDate = moment(date1, "YYYY-MM-DD", true);
    const toDate = moment(date2, "YYYY-MM-DD", true);
    const isBefore = fromDate.isBefore(toDate);
    return isBefore;
}

// @route    PUT api/profile/experience
// @desc     Add profile experience
//所以add是可以用post和put的
// @access   Private
router.put(
    "/experience",
    auth,
    check("jobTitle", "Job Title is required").notEmpty(),
    check("employer", "Employer is required").notEmpty(),
    check("from", "From date is required and needs to be from the past")
        .notEmpty()
        .custom((value, { req }) =>
            req.body.to ? compareDates(value, req.body.to) : true
        ), //If req.body.to exists (req.body.to is truthy), the validation checks if value is less than req.body.to. This ensures that the from value is less than the to value.
    //The .custom() validator method in express-validator allows you to define custom validation logic for a specific field in a request body.
    //from 和to的大小关系要检查
    async (req, res) => {
        const errors = validationResult(req); //用validationResult check那些条目
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.experience.unshift(req.body); //unshift the most recent experience
            await profile.save();
            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server Error");
        }
    }
);

// @route    DELETE api/profile/experience/:exp_id
// @desc     Delete experience from profile
// @access   Private
router.delete("/experience/:exp_id", auth, async (req, res) => {
    try {
        const foundProfile = await Profile.findOne({ user: req.user.id });

        foundProfile.experience = foundProfile.experience.filter(
            (exp) => exp._id.toString() !== req.params.exp_id
        );

        await foundProfile.save();
        return res.status(200).json(foundProfile);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Server error" });
    }
});

// @route    update api/profile/project/updateProjectsBatch
// @desc     replace the whole projects with a batch of projects of the current user's profile
// @access   Private

router.put("/project/updateProjectsBatch", auth, async (req, res) => {
    try {
        // const { userId, projects } = req.body;

        const foundProfile = await Profile.findOne({ user: req.user.id });
        if (!foundProfile) {
            return res.status(404).json({ msg: "Profile not found" });
        }

        // Replace the projects array with the new one
        foundProfile.project = req.body.projects;

        await foundProfile.save();
        res.json(foundProfile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route    PUT api/profile/project
// @desc     Add profile one project
//所以add是可以用post和put的
// @access   Private
router.put(
    "/project",
    auth,
    check("project_name", "project name is required").notEmpty(),
    async (req, res) => {
        const errors = validationResult(req); //用validationResult check那些条目
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const foundProfile = await Profile.findOne({ user: req.user.id });
            foundProfile.project.push(req.body); //push the most recent project
            await foundProfile.save();
            res.json(foundProfile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server Error");
        }
    }
);

// @route    DELETE api/profile/project/:proj_id
// @desc     Delete project from profile
// @access   Private
router.delete("/project/:proj_id", auth, async (req, res) => {
    //在这个引号里面你不用写profile，因为这一本的代码都是写在profile里面，
    try {
        const foundProfile = await Profile.findOne({ user: req.user.id });

        foundProfile.project = foundProfile.project.filter(
            (proj) => proj._id.toString() !== req.params.proj_id
        );

        await foundProfile.save();
        return res.status(200).json(foundProfile);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Server error" });
    }
});

// @route    PUT api/profile/education
// @desc     Add profile education
// @access   Private
router.put(
    "/education",
    auth,
    check("school", "School is required").notEmpty(),
    check("degree", "Degree is required").notEmpty(),
    check("fieldofstudy", "Field of study is required").notEmpty(),
    check("from", "From date is required and needs to be from the past")
        .notEmpty()
        .custom((value, { req }) => (req.body.to ? value < req.body.to : true)),
    async (req, res) => {
        const errors = validationResult(req); //check完之后用 validationResult
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id });

            profile.education.unshift(req.body);

            await profile.save();

            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server Error");
        }
    }
);

// @route    DELETE api/profile/education/:edu_id
// @desc     Delete education from profile
// @access   Private

router.delete("/education/:edu_id", auth, async (req, res) => {
    try {
        const foundProfile = await Profile.findOne({ user: req.user.id });
        foundProfile.education = foundProfile.education.filter(
            (edu) => edu._id.toString() !== req.params.edu_id
        );
        await foundProfile.save();
        return res.status(200).json(foundProfile);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Server error" });
    }
});

// @route    GET api/profile/github/:username
// @desc     Get user repos from Github
// @access   Public
router.get("/github/:username", async (req, res) => {
    try {
        const uri = encodeURI(
            `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
        );
        const headers = {
            "user-agent": "node.js",
            Authorization: `token ${config.get("githubToken")}`,
        };

        const gitHubResponse = await axios.get(uri, { headers });
        return res.json(gitHubResponse.data);
    } catch (err) {
        console.error(err.message);
        return res.status(404).json({ msg: "No Github profile found" });
    }
});

export default router;
