const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");
const normalize = require("normalize-url");

const User = require("../../models/User");

// @route    POST api/users
// @desc     Register user
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
        const errors = validationResult(req); //这一行！
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        try {
            let user = await User.findOne({ email }); //if existing email address

            if (user) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: "User already exists" }] });
            }

            const avatar = normalize(
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

module.exports = router;
