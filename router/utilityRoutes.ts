import express from "express";
import {
  createCandidate,
  getAllCandidate,
  getEmailData,
  getReport,
} from "../controller/utilityControllers";

const router = express.Router();

router.post("/candidate", createCandidate);
router.get("/candidate", getAllCandidate);
router.get("/email", getEmailData);
router.get("/report", getReport);

export default router;
