const userModel = require("../models/user.model");
const JWT = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
    try {

        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "No token provided"
            });
        }

        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        req.user = user;
        next();

    } catch (error) {
        res.status(401).json({
            message: "Unauthorized",
            error: error.message
        });
    }
}

const authSystemUserMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "No token provided"
            });
        }

        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id).select("+systemUser");
        if (!user || !user.systemUser) {
            return res.status(403).json({
                message: "Unauthorized system user"
            });
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            message: "Unauthorized",
            error: error.message
        });
    }
}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware
};
