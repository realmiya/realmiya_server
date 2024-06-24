import express from "express";
const router = express.Router();
import auth from "../../middleware/auth.js";
import { check, validationResult } from "express-validator";
import checkObjectId from "../../middleware/checkObjectId.js";
import Project from "../../models/Project.js";
// Create and Update new project by admin
// @route    POST api/project
// @desc     Create or update user project
// @access   Private
router.post(
    "/",
    auth,
    // Validation rules

    // check("project_id", "project_id is required").notEmpty(),
    check("project_name", "project_name is required").notEmpty(),
    check("time_period", "time_period is required").notEmpty(),
    check("description", "description is required").notEmpty(),
    async (req, res) => {
        //POST 请求是一种 HTTP 请求方法，用于向指定资源提交要处理的数据。在 Web 开发中，它通常用于将数据发送到服务器以创建或更新资源。
        // Gather validation results
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() }); //Bad Request
        }

        const { project_name, time_period, description, ...rest } = req.body;
        // if (isNaN(project_id)) {
        //     return res.status(400).json({ msg: "project_id must be a number" });
        // }

        // try {
        //     const project = new Project(projectData);
        //     await project.save();
        //     res.status(201).send(project); // a status code of 201 (Created)
        // } catch (err) {
        //     res.status(400).send(err); //a status code of 400 (Bad Request) and includes the error message.
        // }
        const projectFields = {
            // project_id: project_id,
            project_name: project_name,
            time_period: time_period,
            description: description,
            ...rest,
        };
        try {
            // Using upsert option (creates new doc if no match is found):
            let project = await Project.findOneAndUpdate(
                // { project_id: project_id },
                { $set: projectFields },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
            // upsert 更新插入
            // { new: true }: Returns the modified document rather than the original.
            // { upsert: true }: Creates a new document if no match is found.
            // { setDefaultsOnInsert: true }: When upserting, applies the default values of the schema if a new document is created.

            return res.json(project);
        } catch (err) {
            console.error(err.message);
            return res.status(500).send("Server Error");
        }
    }
);

// Get all projects
// @route    GET api/projects
// @desc     Get all projects
// @access   Public
router.get("/", async (req, res) => {
    try {
        const projects = await Project.find();
        res.status(200).send(projects);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Get a project by project_id
// @route    GET api/project/:project_id
// @desc     Get project by project_id
// @access   Public

router.get(
    "/project/:project_id",
    checkObjectId("project_id"),

    async (req, res) => {
        const { project_id } = req.params;
        try {
            const project = await Project.findById(project_id);
            if (!project) {
                return res.status(404).send("Project not found");
            }
            res.status(200).send(project);
        } catch (err) {
            res.status(500).send(err);
        }
    }
);

// @route    GET api/project/me  //me is current user
// @desc     Get current user's project
// @access   Private
// one projects can belong to several developers
router.get("/me", auth, async (req, res) => {
    try {
        const project = await Project.findOne({
            user: req.user.id,
            // 为什么你可以用req.user.id to access the ID of the currently authenticated user?
            // 因为the auth middleware populates req.user with the user's information,查看middleware/auth.js
            //  typically by verifying a JSON Web Token (JWT) sent with the request.
        }); //这里的意思是用('user', ['name', 'avatar'])populate你get的response，aka当前用jwt里面解析出来的current user
        // Selects Specific Fields: Only the name and avatar fields from the User document are included in the final result. Other fields like email or password are excluded.
        // 这个设置就这样，还记得那个死胖子的头像出来了吗
        if (!project) {
            return res
                .status(400)
                .json({ msg: "There is no project for this user" });
        }

        res.json(project); //把拿到的project发给res的意思
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Update a project by ID using const updates = req.body;
router.put("/:project_id", async (req, res) => {
    const { project_id } = req.params;
    const updates = req.body;
    try {
        const project = await Project.findByIdAndUpdate(project_id, updates, {
            new: true,
            runValidators: true,
        });
        if (!project) {
            return res.status(404).send("Project not found");
        }
        res.status(200).send(project);
    } catch (err) {
        res.status(400).send(err);
    }
});

// Delete a project by project_id
router.delete("/:project_id", async (req, res) => {
    const { project_id } = req.params;
    try {
        const project = await Project.findByIdAndDelete(project_id);
        if (!project) {
            return res.status(404).send("Project not found");
        }
        res.status(200).send("Project deleted");
    } catch (err) {
        res.status(500).send(err);
    }
});

export default router;
