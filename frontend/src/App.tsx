import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { fetchProfiles, Profile, ProfileResponse } from "./services/api";
import "./styles.css";

const hiddenAdditionalFields = new Set([
  "full_name", "headline", "job_title", "location_name", "linkedin_url",
  "summary", "skills", "experience", "education", "phone_numbers", "emails"
]);

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function displayValue(value: unknown): ReactNode {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value)) {
    return value.length ? <ul>{value.map((item, index) => <li key={index}>{displayValue(item)}</li>)}</ul> : null;
  }
  if (typeof value === "object") {
    return <dl>{Object.entries(value as Record<string, unknown>).map(([key, item]) => {
      const rendered = displayValue(item);
      return rendered ? <div key={key}><dt>{label(key)}</dt><dd>{rendered}</dd></div> : null;
    })}</dl>;
  }
  return String(value);
}

function Icon({ children }: { children: ReactNode }) {
  return <span className="icon" aria-hidden="true">{children}</span>;
}

function DataSection({ title, icon, value }: { title: string; icon: string; value: unknown }) {
  const rendered = displayValue(value);
  return rendered ? <section className="profile-section"><div className="section-heading"><span className="section-icon">{icon}</span><h3>{title}</h3></div><div className="profile-data">{rendered}</div></section> : null;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function ProfileCard({ profile }: { profile: Profile }) {
  const source = profile.rawData;
  const skills = Array.isArray(source.skills) ? source.skills : profile.skills;
  const linkedinUrl = typeof source.linkedin_url === "string" ? source.linkedin_url : profile.linkedinUrl;
  const emails = Array.isArray(source.emails) ? source.emails : [];
  const phones = Array.isArray(source.phone_numbers) ? source.phone_numbers : [];

  return <article className="profile-card">
    <div className="profile-header">
      <div className="avatar">{initials(profile.name)}</div>
      <div className="identity">
        <h2>{profile.name}</h2>
        {(source.headline || profile.headline) && <p className="headline">{String(source.headline ?? profile.headline)}</p>}
        {(source.location_name || profile.location) && <p className="meta"><Icon>⌖</Icon>{String(source.location_name ?? profile.location)}</p>}
      </div>
      {linkedinUrl && <a className="linkedin-link" href={String(linkedinUrl).startsWith("http") ? String(linkedinUrl) : `https://${linkedinUrl}`} target="_blank" rel="noreferrer">in <span>LinkedIn</span></a>}
    </div>

    {Boolean(source.summary || profile.summary || emails.length || phones.length) && <div className="profile-overview">
      {(source.summary || profile.summary) && <p>{String(source.summary ?? profile.summary)}</p>}
      {(emails.length > 0 || phones.length > 0) && <div className="contact-list">
        {emails.map((item, index) => <span key={`email-${index}`}><Icon>✉</Icon>{typeof item === "object" && item !== null ? String((item as { address?: unknown }).address ?? "") : String(item)}</span>)}
        {phones.map((item, index) => <span key={`phone-${index}`}><Icon>⌕</Icon>{String(item)}</span>)}
      </div>}
    </div>}

    <div className="profile-grid">
      <DataSection title="Experience" icon="↗" value={source.experience ?? profile.experiences} />
      <DataSection title="Education" icon="⌂" value={source.education ?? profile.education} />
    </div>

    {skills.length > 0 && <section className="profile-section skills-section">
      <div className="section-heading"><span className="section-icon">✦</span><h3>Skills</h3></div>
      <div className="skill-list">{skills.map((skill, index) => <span className="skill-tag" key={index}>{typeof skill === "object" && skill !== null ? JSON.stringify(skill) : String(skill)}</span>)}</div>
    </section>}

    <DataSection title="Additional information" icon="＋" value={Object.fromEntries(
      Object.entries(source).filter(([key, value]) => !hiddenAdditionalFields.has(key) && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0))
    )} />
  </article>;
}

function ProfileSkeleton() {
  return <div className="profile-card skeleton-card" aria-hidden="true">
    <div className="skeleton skeleton-avatar" />
    <div className="skeleton skeleton-title" />
    <div className="skeleton skeleton-line wide" />
    <div className="skeleton skeleton-line" />
    <div className="skeleton skeleton-block" />
  </div>;
}

export default function App() {
  const [draft, setDraft] = useState({ q: "", skill: "", jobTitle: "" });
  const [filters, setFilters] = useState({ q: "", skill: "", jobTitle: "" });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  useEffect(() => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");
    fetchProfiles({ ...filters, page, limit: 10 })
      .then((nextResult) => {
        if (currentRequest === requestId.current) setResult(nextResult);
      })
      .catch(() => {
        if (currentRequest === requestId.current) setError("We couldn't load profiles. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [filters, page]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setFilters({ ...draft });
  };

  const clearFilters = () => {
    const empty = { q: "", skill: "", jobTitle: "" };
    setDraft(empty);
    setFilters(empty);
    setPage(1);
  };

  const updateDraft = (field: keyof typeof draft, value: string) => setDraft((current) => ({ ...current, [field]: value }));
  const hasFilters = Boolean(filters.q || filters.skill || filters.jobTitle);
  const firstResult = result && result.pagination.total > 0 ? (page - 1) * result.pagination.limit + 1 : 0;
  const lastResult = result ? Math.min(page * result.pagination.limit, result.pagination.total) : 0;

  return <main className="app-shell">
    <header className="hero">
      <div className="brand-row"><div className="brand-mark">L</div><span>LinkedIn Dataset Search</span></div>
      <div className="hero-copy">
        <p className="eyebrow">PROFILE DISCOVERY</p>
        <h1>Find the people shaping <span>what's next.</span></h1>
        <p className="hero-description">Search across the imported LinkedIn dataset to discover professionals by expertise, experience, and education.</p>
      </div>
      <form className="search-panel" onSubmit={submit}>
        <div className="search-row">
          <label className="search-input"><Icon>⌕</Icon><input value={draft.q} onChange={(event) => updateDraft("q", event.target.value)} placeholder="Search names, skills, companies, or keywords" aria-label="Keyword search" /></label>
          <button className="primary-button" type="submit"><Icon>⌕</Icon> Search profiles</button>
        </div>
        <div className="filter-row">
          <label><span>Skill</span><input value={draft.skill} onChange={(event) => updateDraft("skill", event.target.value)} placeholder="e.g. React, recruiting" aria-label="Skill filter" /></label>
          <label><span>Job title</span><input value={draft.jobTitle} onChange={(event) => updateDraft("jobTitle", event.target.value)} placeholder="e.g. Product manager" aria-label="Job title filter" /></label>
          <button className="clear-button" type="button" onClick={clearFilters} disabled={!draft.q && !draft.skill && !draft.jobTitle}>Clear filters</button>
        </div>
      </form>
    </header>

    <section className="results-area">
      <div className="results-toolbar">
        <div><p className="eyebrow">SEARCH RESULTS</p><h2>{loading ? "Finding profiles..." : hasFilters ? "Matching profiles" : "All profiles"}</h2></div>
        {result && !loading && <span className="result-count">{firstResult}-{lastResult} of {result.pagination.total}</span>}
      </div>
      {loading && <div className="profile-list"><ProfileSkeleton /><ProfileSkeleton /></div>}
      {!loading && error && <div className="state-card error-state"><span className="state-icon">!</span><h3>Something went wrong</h3><p>{error}</p><button className="primary-button" onClick={() => setFilters({ ...filters })}>Try again</button></div>}
      {!loading && !error && result && result.data.length === 0 && <div className="state-card"><span className="state-icon">⌕</span><h3>No profiles found</h3><p>Try a different keyword or remove one of the filters.</p><button className="clear-button" onClick={clearFilters}>Clear search</button></div>}
      {!loading && !error && result && result.data.length > 0 && <div className="profile-list">{result.data.map((profile) => <ProfileCard key={profile.id} profile={profile} />)}</div>}
      {result && result.pagination.totalPages > 1 && <nav className="pagination" aria-label="Pagination">
        <button className="page-button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>← <span>Previous</span></button>
        <span>Page <strong>{result.pagination.page}</strong> of <strong>{result.pagination.totalPages}</strong></span>
        <button className="page-button" disabled={page >= result.pagination.totalPages || loading} onClick={() => setPage((value) => value + 1)}><span>Next</span> →</button>
      </nav>}
    </section>
  </main>;
}
