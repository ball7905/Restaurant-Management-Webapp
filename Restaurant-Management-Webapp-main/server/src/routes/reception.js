import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

import {
  getTables,
  getBookings,
  createBooking,
  checkInBooking,
  cancelBooking,
  getCustomerInfo,
  getServingOrders,
  getBillDetails,
  processPayment,
} from "../controllers/receptionController.js";

const router = express.Router();

router.use(verifyToken);
router.use(allowRoles("Lễ tân", "Quản lý"));

router.get("/tables", getTables);
router.get("/bookings", getBookings);

router.post("/book", createBooking);
router.post("/check-in/:id", checkInBooking);
router.post("/cancel/:id", cancelBooking);

router.get("/customer", getCustomerInfo);
router.post("/pay", processPayment);
router.get("/bill/:orderId", getBillDetails);
router.get("/serving-orders", getServingOrders);

export default router;
