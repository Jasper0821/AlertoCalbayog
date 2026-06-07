const express = require("express");
const router = express.Router();
const { createUser, deleteUser, getAllUsers, updateUser } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/", authMiddleware, roleMiddleware("admin"), getAllUsers);
router.post("/", authMiddleware, roleMiddleware("admin"), createUser);
router.put("/:id", authMiddleware, roleMiddleware("admin"), updateUser);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteUser);

module.exports = router;
