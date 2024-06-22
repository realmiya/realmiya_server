import mongoose from "mongoose";

// middleware to check for a valid object id验证请求参数中的 MongoDB ObjectID
const checkObjectId = (idToCheck) => (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params[idToCheck]))
        return res.status(400).json({ msg: "Invalid ID" });
    next(); //中间件调用next()函数将控制权传递给下一个中间件函数。
};

export default checkObjectId;
