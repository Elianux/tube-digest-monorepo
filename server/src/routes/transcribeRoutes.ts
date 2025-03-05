import express from "express";
import { handleTranscribe } from "../controllers/transcribeController";

const router = express.Router();

router.post("/transcribe", handleTranscribe);

export default router;
