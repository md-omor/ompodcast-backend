const router = require("express").Router();
const activateController = require("./controllers/activate-controller");
const authController = require("./controllers/auth-controller");
const roomsCntroller = require("./controllers/rooms-controller");
const authMiddleware = require("./middlewares/auth-middleware");

router.post("/api/send-otp", authController.sendOtp);
router.post("/api/verify-otp", authController.verifyOtp);
router.post("/api/activate", authMiddleware, activateController.activate);
router.get("/api/refresh", authController.refresh);
router.post("/api/logout", authMiddleware, authController.logout);
router.post("/api/rooms", authMiddleware, roomsCntroller.create);
router.get("/api/rooms", authMiddleware, roomsCntroller.index);
router.get("/api/rooms/:roomId", authMiddleware, roomsCntroller.show);

module.exports = router;
