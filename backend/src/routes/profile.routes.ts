import { Router } from "express";
import { getProfiles } from "../controllers/profile.controller";

export const profileRouter = Router();
profileRouter.get("/profiles", getProfiles);
