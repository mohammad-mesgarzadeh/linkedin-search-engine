import JSON5 from "json5";
import { readFile } from "node:fs/promises";
import path from "node:path";

export interface DatasetRow {
  full_name?: string;
  headline?: string;
  job_title?: string;
  location_name?: string;
  summary?: string;
  interests?: string;
  linkedin_url?: string;
  linkedin_id?: string;
  skills?: unknown;
  experience?: unknown;
  education?: unknown;
  [key: string]: unknown;
}

export type DatasetValue = string | number | boolean | null | DatasetValue[] | { [key: string]: DatasetValue };

export interface ParsedExperience {
  company?: { name?: string };
  title?: string;
  start_date?: string;
  end_date?: string;
  summary?: string;
}

export interface ParsedEducation {
  school?: { name?: string };
  degrees?: string[];
  majors?: string[];
  start_date?: string;
  end_date?: string;
  summary?: string;
}

export const text = (value: unknown): string | undefined => {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : undefined;
};

export function searchableText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(searchableText).filter(Boolean).join(" ");
  if (typeof value === "object") return Object.values(value).map(searchableText).filter(Boolean).join(" ");
  return "";
}

export function parseStructured<T>(value: unknown): T {
  if (Array.isArray(value) || (value !== null && typeof value === "object")) return value as T;
  if (typeof value !== "string" || value.trim() === "" || value.trim() === "[]") return [] as T;
  const normalized = value.replace(/\bNone\b/g, "null").replace(/\bTrue\b/g, "true").replace(/\bFalse\b/g, "false");
  try {
    return JSON5.parse(normalized) as T;
  } catch {
    return [] as T;
  }
}

export async function readDataset(filePath = path.resolve(__dirname, "../../../dataset/linkedin_profiles.json")) {
  const content = await readFile(filePath, "utf8");
  const rows: unknown = JSON.parse(content);
  if (!Array.isArray(rows)) throw new Error("Dataset JSON must contain an array of profiles.");
  return rows as DatasetRow[];
}
