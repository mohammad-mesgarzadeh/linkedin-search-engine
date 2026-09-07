import axios from "axios";

export interface Profile {
  id: number;
  name: string;
  headline?: string | null;
  jobTitle?: string | null;
  location?: string | null;
  summary?: string | null;
  linkedinUrl?: string | null;
  rawData: Record<string, unknown>;
  searchableText: string;
  skills: string[];
  experiences: { company?: string | null; title?: string | null; startDate?: string | null; endDate?: string | null }[];
  education: { institution?: string | null; degree?: string | null; major?: string | null }[];
}
export interface ProfileResponse { data: Profile[]; pagination: { page: number; limit: number; total: number; totalPages: number } }

export async function fetchProfiles(params: { q: string; skill: string; jobTitle: string; page: number; limit: number }) {
  const response = await axios.get<ProfileResponse>("/api/profiles", { params });
  return response.data;
}
