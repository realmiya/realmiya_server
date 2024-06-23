import express from "express";
const router = express.Router();
import gravatar from "gravatar"; //for displaying a user's avatar based on their email address.
// The Gravatar service generates a URL to an avatar image that can be used
import bcrypt from "bcryptjs";
//bcryptjs is a library that provides functions for hashing passwords and comparing hashed passwords.

//Purpose: The jsonwebtoken library is used to create and verify JSON Web Tokens
// Creating Tokens: Use jwt.sign(payload, secret, options) to create a token.登陆时候用的The payload contains user data, the secret is a key for signing the token, and options can specify token expiration.
import config from "config";
import { check, validationResult } from "express-validator";
import User from "../../models/User.js";
import normalizeUrl from "normalize-url";
import jwt from "jsonwebtoken";

//这个文件都在搞user注册
// @route    POST api/users
// @desc     Register user下面一波post是在用户注册的时候用的，和用户登陆不一样,此处是注册，用post，用check，如果是登陆用的是jwt.sign()
// @access   Public
//if your website needs user register
router.post(
    "/",
    check("name", "Name is required").notEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
        "password",
        "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }), //这个逗号前set所有的validation
    async (req, res) => {
        const errors = validationResult(req); //这一行 is used to collect and process the results of the validations performed on the incoming HTTP request.
        // This is part of the express-validator library, which is used to validate and sanitize验证和清理 incoming data in Express.js applications.
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        try {
            let user = await User.findOne({ email }); //if existing email address

            if (user) {
                return res.status(400).json({
                    errors: [
                        {
                            msg: "User already exists and email address has registered",
                        },
                    ],
                });
            }

            const avatar = normalizeUrl(
                gravatar.url(email, {
                    s: "200",
                    r: "pg",
                    d: "mm",
                }),
                { forceHttps: true }
            );

            user = new User({
                name,
                email,
                avatar,
                password,
            });

            const salt = await bcrypt.genSalt(10);

            user.password = await bcrypt.hash(password, salt);

            await user.save(); //这是一个promise，所以说 .save是整出一个promise，所以一开始可以加await

            const payload = {
                user: {
                    id: user.id, //此处的user来自await user.save()里面的user
                },
            };

            jwt.sign(
                payload,
                config.get("jwtSecret"), //jwtsecret从config文件夹里面找
                { expiresIn: "5 days" }, //一般设置为3600秒也就是一个小时，每小时测试一下，但是我们写程序不想写得测试太多次
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server error");
        }
    }
);

// GET /api/users - Get all users
router.get("/", async (req, res) => {
    try {
        const users = await User.find(); // Fetch all users
        res.json(users); // Send users as JSON response
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

export default router;
