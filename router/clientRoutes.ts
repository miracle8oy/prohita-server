import express from "express";
import {
  createClient,
  getAllMasterClient,
  updateMasterClient,
  getSingleMasterClient,
} from "../controller/clientController";
import { verifyAdminToken } from "../middleware/verifyToken";

const router = express.Router();

router.post("/v1/client", verifyAdminToken, createClient);
router.put("/v1/client/:id", verifyAdminToken, updateMasterClient);
router.get("/v1/client", verifyAdminToken, getAllMasterClient);
router.get("/v1/client/:id", verifyAdminToken, getSingleMasterClient);

export default router;
