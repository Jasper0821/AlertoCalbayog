const express = require("express");
const router = express.Router();
const { getAllUsers } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/", authMiddleware, roleMiddleware("admin"), getAllUsers);

module.exports = router;