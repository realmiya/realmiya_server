import jwt from "jsonwebtoken";
import config from "config";

const authMiddleware = function (req, res, next) {
    // Get token from header
    const token = req.header("x-auth-token");

    // Check if there is no token
    if (!token) {
        return res.status(401).json({ msg: "No token, authorization denied" });
    }

    // Verify token
    try {
        jwt.verify(token, config.get("jwtSecret"), (error, decoded) => {
            //如果干不了decode过程i.e.jwt.verify(token, config.get('jwtSecret')那么就是error，
            // 如果干得了jwt.verify(token, config.get('jwtSecret')就是decoded的值
            if (error) {
                return res.status(401).json({ msg: "Token is not valid" });
            } else {
                req.user = decoded.user; //如果 jwt.verify(token, config.get('jwtSecret')) 成功，那么 'decoded' 将包含解码后的token数据。
                next(); //中间件调用next()函数将控制权传递给下一个中间件函数。
            }
        });
    } catch (err) {
        console.error("something wrong with auth middleware");
        res.status(500).json({ msg: "500 Internal Server Error" });
    }
};

export default authMiddleware;
