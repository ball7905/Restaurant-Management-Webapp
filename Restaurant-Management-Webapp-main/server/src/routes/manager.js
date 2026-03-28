import express from "express";
import {
  addEmployee,
  getEmployees,
  addMenuItem,
  getMenuItems,
  getStats,
  updateEmployee,
  deleteEmployee,
  deleteMenuItem,
  updateMenuItem,
  getEmployeePhones,
  addEmployeePhone,
  deleteEmployeePhone,
  getRevenueReport,
  generatePeriodicReport,
} from "../controllers/managerController.js";
import {
  getPendingMenuRequests,
  processMenuRequest,
} from "../controllers/managerController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(verifyToken);
router.get("/stats", getStats);
router.get("/employees", getEmployees);
router.post("/add-employee", addEmployee);
router.put("/update-employee/:id", updateEmployee);
router.post("/delete-employee/:id", deleteEmployee);
router.get("/employee-phones/:id", getEmployeePhones);
router.post("/add-phone", addEmployeePhone);
router.post("/delete-phone", deleteEmployeePhone);
router.get("/menu", getMenuItems);

router.get("/requests", getPendingMenuRequests);
router.post("/process/:id", processMenuRequest);

router.get("/reports/revenue", getRevenueReport);
router.post("/reports/generate", generatePeriodicReport);

//redundant manager directly update menu
router.post("/add-menu-item", addMenuItem);
router.put("/update-menu-item/:id", updateMenuItem);
router.post("/delete-menu-item/:id", deleteMenuItem);

export default router;
