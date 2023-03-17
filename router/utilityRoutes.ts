import express from "express";
import {
  getEmailData,
  getReport,
  getReportDashboard,
} from "../controller/utilityControllers";
import { verifyAdminToken } from "../middleware/verifyToken";

const router = express.Router();

router.get("/email", getEmailData);
router.get("/report", verifyAdminToken, getReport);
router.get("/report-dashboard", verifyAdminToken, getReportDashboard);

export default router;
