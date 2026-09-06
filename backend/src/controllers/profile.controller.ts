import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { searchProfiles } from "../services/profile.service";

const querySchema = z.object({
  q: z.string().trim().optional(),
  skill: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10)
});

export async function getProfiles(request: Request, response: Response, next: NextFunction) {
  const parsed = querySchema.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid query parameters", details: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    response.json(await searchProfiles(parsed.data));
  } catch (error) {
    next(error);
  }
}
