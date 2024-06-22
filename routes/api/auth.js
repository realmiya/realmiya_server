import express from "express";
import bcrypt from "bcryptjs";
import auth from "../../middleware/auth.js";
import jwt from "jsonwebtoken"; // for jwt.sign()
import config from "config";
import { check, validationResult } from "express-validator";
import User from "../../models/User.js";

const router = express.Router();

// @desc     Get user by token（登陆的时候用的一个中间键，用于获取信息）
// @route    GET api/auth
//middleware里面的那个auth就没有route，因为它是一个function，是一个用在routes的get、post、del里面用的一个中间键，当然不用写route
// @access   Private
// const authRouter = express.Router();

router.get("/", auth, async (req, res) => {
    //这个auth是从middleware出来的
    try {
        const user = await User.findById(req.user.id).select("-password"); //.select('-password'): The select method modifies the query to exclude the password field from the returned document.
        // This is useful for security reasons, ensuring that sensitive information like the user's password is not exposed in the response.
        //By using .select('-password'), you ensure that the password field is omitted from the user object sent back to the client, thus enhancing the security of your application.
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @desc     Authenticate user & get token（登陆的时候用的一个中间键，用于验证邮件是被注册的以及密码与邮件相符）
// @route    POST api/auth
// @access   Public
router.post(
    "/",
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;
        //从req里面 pull out出email和password

        try {
            let user = await User.findOne({ email });

            if (!user) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: "Invalid Credentials" }] });
            }
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: "Invalid Credentials" }] });
            }

            const payload = {
                user: {
                    id: user.id,
                },
            };

            jwt.sign(
                //jwt.sign() is a function provided by the jsonwebtoken library in Node.js.登陆的时候用，用户在登陆的时候能生成一个token
                //jwt.sign() creates a JWT (JSON Web Token) by signing a payload with a secret key.
                payload,
                config.get("jwtSecret"),
                { expiresIn: "5 days" },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token }); //In Express.js, res.json() is used to send a JSON response back to the client when an HTTP request is made to an Express route.
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server error");
        }
    }
);

export default router;
