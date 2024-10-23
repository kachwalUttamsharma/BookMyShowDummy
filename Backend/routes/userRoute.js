const router = require("express").Router();
const {
  registerUser,
  loginUser,
  currentUser,
  forgetPassword,
  resetPassword,
} = require("../controllers/UserController");
const { validateJWTToken } = require("../middleware/authorizationMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/getCurrentUser", validateJWTToken, currentUser);
router.patch("/forgetPassword", forgetPassword);
router.patch("/resetPassword", resetPassword);

module.exports = router;
