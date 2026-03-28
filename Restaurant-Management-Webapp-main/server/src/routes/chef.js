import express from "express";
import {
  getKitchenQueue,
  getChefRequests,
  updateOrderStatus,
  submitMenuRequest,
} from "../controllers/chefController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();
router.use(verifyToken);

router.get("/queue", getKitchenQueue);
router.put("/update-order/:id", updateOrderStatus);
router.post("/submit", submitMenuRequest);
router.get("/requests", getChefRequests);

export default router;
