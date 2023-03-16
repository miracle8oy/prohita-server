import express from "express";
import {
  createFile,
  getAllFile,
  getSingleFile,
  updateFile,
  deleteFile,
} from "../controller/fileControllers";
import { verifyAdminToken } from "../middleware/verifyToken";
import upload from "../middleware/uploadFile";

const router = express.Router();

router.post("/v1/file", verifyAdminToken, upload.single("file"), createFile);
router.put("/v1/file/:id", verifyAdminToken, upload.single("file"), updateFile);
router.get("/v1/file", verifyAdminToken, getAllFile);
router.get("/v1/file/:id", verifyAdminToken, getSingleFile);
router.delete("/v1/file/:id", verifyAdminToken, deleteFile);

export default router;
