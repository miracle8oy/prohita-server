import express from "express";
import {
  createMasterFile,
  getAllMasterFile,
  updateMasterFile,
  getSingleMasterFile,
} from "../controller/masterFileControllers";
import { verifyAdminToken } from "../middleware/verifyToken";

const router = express.Router();

router.post("/v1/master", verifyAdminToken, createMasterFile);
router.put("/v1/master/:id", verifyAdminToken, updateMasterFile);
router.get("/v1/master", verifyAdminToken, getAllMasterFile);
router.get("/v1/master/:id", verifyAdminToken, getSingleMasterFile);

export default router;
