const jwt = require("jsonwebtoken");

/**
 * Middleware to authenticate JWT tokens
 * Assumes token is in the format: "Bearer <token>"
 */
const authenticateMiddleware = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "Access denied. No Authorization header provided." });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader; // fallback in case token is sent directly

    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // Attach decoded payload to request (e.g., id, role)
    next();
  } catch (error) {
    console.error("JWT verification failed:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { authenticateMiddleware };
