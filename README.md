# LinkedIn Dataset Search Engine

## 1. How to Run

Requirements: Docker and Docker Compose.

From the project root, start the full application:

```powershell
docker compose up --build
```

The backend waits for PostgreSQL, applies Prisma migrations, and imports
`dataset/linkedin_profiles.json` automatically.

Frontend: <http://localhost:5173>  
Backend API: <http://localhost:4000>

## 2. Architecture Overview

Frontend:

- React, TypeScript, Vite, and Axios
- Communicates with the backend API
- Displays profiles, search results, filters, and pagination

Backend:

- Express REST API with TypeScript
- Handles search, filtering, and pagination
- Communicates with PostgreSQL through Prisma

Database:

- PostgreSQL stores profiles, skills, experience, and education
- Data is imported from `dataset/linkedin_profiles.json`

Data flow:

```text
300 user linkedin.txt
        |
        v
linkedin_profiles.json
        |
        v
PostgreSQL
        |
        v
Backend API
        |
        v
Frontend
```

## 3. Search and Filters

Search uses keywords across relevant profile fields, including names, job
titles, locations, skills, experience, and education.

Available filters:

- Skill
- Job title

Skill and job-title filters can be combined with keyword search.
