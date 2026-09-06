import { FormEvent, useEffect, useState } from "react";
import { fetchProfiles, Profile, ProfileResponse } from "./services/api";
import "./styles.css";

function ProfileCard({ profile }: { profile: Profile }) {
  return <article className="card">
    <h2>{profile.name}</h2>
    {profile.jobTitle && <strong>{profile.jobTitle}</strong>}
    {profile.headline && <p>{profile.headline}</p>}
    {profile.location && <p className="muted">{profile.location}</p>}
    {profile.skills.length > 0 && <p><b>Skills:</b> {profile.skills.join(", ")}</p>}
    {profile.experiences.length > 0 && <p><b>Experience:</b> {profile.experiences.slice(0, 2).map((item) => [item.title, item.company].filter(Boolean).join(" at ")).join("; ")}</p>}
    {profile.education.length > 0 && <p><b>Education:</b> {profile.education.slice(0, 2).map((item) => [item.degree, item.institution].filter(Boolean).join(" - ")).join("; ")}</p>}
  </article>;
}

export default function App() {
  const [q, setQ] = useState("");
  const [skill, setSkill] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchProfiles({ q, skill, jobTitle, page, limit: 10 })
      .then(setResult)
      .catch(() => setError("Unable to load profiles. Please try again."))
      .finally(() => setLoading(false));
  }, [q, skill, jobTitle, page]);

  const submit = (event: FormEvent) => { event.preventDefault(); setPage(1); };
  return <main className="container">
    <header><h1>LinkedIn Dataset Search</h1><p>Search profiles from the imported LinkedIn dataset.</p></header>
    <form className="filters" onSubmit={submit}>
      <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search keyword" aria-label="Keyword search" />
      <input value={skill} onChange={(event) => { setSkill(event.target.value); setPage(1); }} placeholder="Skill (e.g. React)" aria-label="Skill filter" />
      <input value={jobTitle} onChange={(event) => { setJobTitle(event.target.value); setPage(1); }} placeholder="Job title" aria-label="Job title filter" />
      <button type="submit">Search</button>
    </form>
    {loading && <p>Loading profiles...</p>}
    {error && <p className="error">{error}</p>}
    {!loading && !error && result && result.data.length === 0 && <p>No profiles found.</p>}
    {!loading && !error && result && result.data.map((profile) => <ProfileCard key={profile.id} profile={profile} />)}
    {result && result.pagination.totalPages > 1 && <nav className="pagination" aria-label="Pagination">
      <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
      <span>Page {result.pagination.page} of {result.pagination.totalPages}</span>
      <button disabled={page >= result.pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
    </nav>}
  </main>;
}
