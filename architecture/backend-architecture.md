# Backend Architecture -- ResumeForge

## Platform

| Layer | Technology |
|-------|-----------|
| Backend-as-a-Service | InsForge BaaS (primary) |
| Database | PostgreSQL (managed, auto-REST API) |
| Storage | InsForge Storage (S3-compatible) |
| Edge Functions | InsForge Edge Functions (Deno runtime) |
| AI Provider | OpenAI GPT-4o (skill matching, resume generation, email drafting) |
| Client SDK | InsForge JavaScript SDK |
| Document Parsing | Next.js API routes (pdf-parse, mammoth for DOCX) |
| Resume Generation | Next.js API routes (pdfkit for PDF, docx for DOCX) |
| Authentication | None (single-user app, anon key only) |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js + React + MUI)              │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐  │
│  │   React Pages     │  │     Next.js API Routes (Node.js)     │  │
│  │                   │  │                                      │  │
│  │  - Profile Form   │  │  POST /api/import/resume             │  │
│  │  - Job Desc Input │  │    → Parse uploaded PDF/DOCX         │  │
│  │  - Resume Preview │  │    → Extract profile data            │  │
│  │  - Applications   │  │                                      │  │
│  │  - Active Apps    │  │  POST /api/import/linkedin            │  │
│  │  - Messaging      │  │    → Parse LinkedIn export PDF       │  │
│  │  - Dashboard      │  │    → Extract profile data            │  │
│  │                   │  │                                      │  │
│  │  Uses InsForge    │  │  POST /api/ai/match                  │  │
│  │  SDK for all DB   │  │    → OpenAI: match skills to JD     │  │
│  │  CRUD operations  │  │    → Return match score + analysis   │  │
│  │                   │  │                                      │  │
│  │                   │  │  POST /api/ai/generate-resume         │  │
│  │                   │  │    → OpenAI: generate tailored resume│  │
│  │                   │  │    → Return structured resume data   │  │
│  │                   │  │                                      │  │
│  │                   │  │  POST /api/resume/pdf                 │  │
│  │                   │  │    → pdfkit: ATS-friendly PDF        │  │
│  │                   │  │                                      │  │
│  │                   │  │  POST /api/resume/docx                │  │
│  │                   │  │    → docx lib: ATS-friendly DOCX     │  │
│  │                   │  │                                      │  │
│  │                   │  │  POST /api/ai/generate-email          │  │
│  │                   │  │    → OpenAI: recruiter email draft   │  │
│  └────────┬─────────┘  └──────────────┬───────────────────────┘  │
│           │                           │                           │
└───────────┼───────────────────────────┼───────────────────────────┘
            │                           │
      ┌─────▼───────────────────────────▼──────┐
      │           InsForge BaaS (Cloud)         │
      │                                         │
      │  ┌───────────────────────────────────┐  │
      │  │         Auto-REST API             │  │
      │  │         (PostgREST)               │  │
      │  │                                   │  │
      │  │  GET / POST / PATCH / DELETE      │  │
      │  │  for all public schema tables     │  │
      │  └───────────────┬───────────────────┘  │
      │                  │                      │
      │  ┌───────────────▼───────────────────┐  │
      │  │      PostgreSQL Database          │  │
      │  │                                   │  │
      │  │  profiles                         │  │
      │  │  work_experiences                 │  │
      │  │  education                        │  │
      │  │  skills                           │  │
      │  │  job_descriptions                 │  │
      │  │  generated_resumes               │  │
      │  │  applications                     │  │
      │  │  active_applications              │  │
      │  │  messaging_sequences              │  │
      │  │  messages                         │  │
      │  └───────────────────────────────────┘  │
      │                                         │
      │  ┌───────────────────────────────────┐  │
      │  │         Storage (S3)              │  │
      │  │                                   │  │
      │  │  Bucket: uploads                  │  │
      │  │    → uploaded resumes (PDF/DOCX)  │  │
      │  │    → LinkedIn export files        │  │
      │  │    → profile pictures             │  │
      │  │                                   │  │
      │  │  Bucket: resumes                  │  │
      │  │    → generated PDF/DOCX resumes   │  │
      │  └───────────────────────────────────┘  │
      │                                         │
      └─────────────────────────────────────────┘
                         │
                         │  (API routes call OpenAI)
                         ▼
               ┌──────────────────┐
               │   OpenAI API     │
               │                  │
               │  GPT-4o          │
               │  - Skill match   │
               │  - Resume gen    │
               │  - Email draft   │
               └──────────────────┘
```

---

## User Flow

```
Step 1: PROFILE CREATION
  User uploads resume (PDF/DOCX)  ──or──  User uploads LinkedIn export
          │                                          │
          ▼                                          ▼
  POST /api/import/resume                POST /api/import/linkedin
  (pdf-parse / mammoth)                  (pdf-parse LinkedIn PDF)
          │                                          │
          └──────────── Extracted data ──────────────┘
                              │
                              ▼
                   Save to InsForge DB
                   (profiles, work_experiences,
                    education, skills)
                              │
                              ▼
                  User reviews & edits profile
                  (manual form editing)

Step 2: JOB DESCRIPTION INPUT
  User pastes JD URL  ──or──  User pastes JD text
          │                          │
          ▼                          ▼
  POST /api/ai/match           Save JD to DB
  (fetch URL content)          (job_descriptions table)
          │                          │
          └────── AI Analysis ───────┘
                      │
                      ▼
             POST /api/ai/match
             (OpenAI: compare profile skills
              vs JD requirements)
                      │
                      ▼
             Return match score + gap analysis
             Display on UI for user review

Step 3: RESUME GENERATION
  User confirms & clicks "Generate Resume"
          │
          ▼
  POST /api/ai/generate-resume
  (OpenAI: tailor resume content to JD)
          │
          ▼
  UI shows progress bar during generation
          │
          ▼
  Resume preview displayed in browser
  (with user profile picture support)
          │
          ▼
  User reviews, edits if needed
          │
          ▼
  User clicks "Download PDF" or "Download DOCX"
          │
          ▼
  POST /api/resume/pdf  or  POST /api/resume/docx
  (pdfkit / docx library — ATS-friendly)
          │
          ▼
  File downloaded + saved to InsForge Storage
          │
          ▼
  Application tracking record created/updated
  (applications table — status, resume_submitted, match_score)
```

---

## API Routes (Next.js Server-Side)

All processing-heavy operations run in Next.js API routes (Node.js runtime) rather than InsForge Edge Functions, because:
- Node.js has richer library support (pdf-parse, mammoth, pdfkit, docx)
- No 30-second timeout or 10MB payload constraints
- Direct access to OpenAI SDK

### Import Routes

#### `POST /api/import/resume`
Parse an uploaded resume file and extract structured profile data.

| Field | Details |
|-------|---------|
| Input | `multipart/form-data` with PDF or DOCX file |
| Libraries | `pdf-parse` (PDF text extraction), `mammoth` (DOCX to text) |
| Process | Extract raw text -> send to OpenAI for structured parsing -> return JSON |
| Output | `{ personalInfo, workExperiences[], education[], skills[] }` |

OpenAI prompt extracts structured data from raw resume text:
- Name, email, phone, location, links
- Work history with company, dates, descriptions
- Education with school, degree
- Skills list

#### `POST /api/import/linkedin`
Parse an uploaded LinkedIn data export PDF.

| Field | Details |
|-------|---------|
| Input | `multipart/form-data` with LinkedIn export PDF |
| Libraries | `pdf-parse` |
| Process | Extract text from LinkedIn PDF -> OpenAI structured parsing -> return JSON |
| Output | Same structure as resume import |

### AI Routes

#### `POST /api/ai/match`
Match user profile skills against a job description.

| Field | Details |
|-------|---------|
| Input | `{ profileId: string, jobDescriptionId: string }` |
| Process | Fetch profile + JD from InsForge -> send to OpenAI for analysis |
| Output | `{ matchScore: number, matchedSkills[], missingSkills[], recommendations[], summary }` |

#### `POST /api/ai/generate-resume`
Generate a tailored resume based on profile data and target job description.

| Field | Details |
|-------|---------|
| Input | `{ profileId: string, jobDescriptionId: string }` |
| Process | Fetch profile + JD -> OpenAI generates optimized resume content -> return structured data |
| Output | `{ summary, workExperiences[], education[], skills[], highlights[] }` |
| Streaming | Uses OpenAI streaming for real-time progress updates via Server-Sent Events |

#### `POST /api/ai/generate-email`
Generate a customized recruiter/hiring manager email.

| Field | Details |
|-------|---------|
| Input | `{ sequenceId: string, stage: string, prompt: string }` |
| Process | Fetch sequence context -> OpenAI generates email -> return content |
| Output | `{ subject, body, tone }` |

### Resume Export Routes

#### `POST /api/resume/pdf`
Generate an ATS-friendly PDF from structured resume data.

| Field | Details |
|-------|---------|
| Input | `{ resumeId: string }` (generated_resumes table ID) |
| Libraries | `pdfkit` |
| Process | Fetch resume data -> build PDF with native text objects -> return binary |
| Output | `application/pdf` with `Content-Disposition: attachment` |
| ATS Strategy | Native PDF text (not canvas), Helvetica font, single-column, clean headings |

#### `POST /api/resume/docx`
Generate an ATS-friendly DOCX from structured resume data.

| Field | Details |
|-------|---------|
| Input | `{ resumeId: string }` |
| Libraries | `docx` (npm) |
| Process | Fetch resume data -> build DOCX with proper Open XML paragraphs -> return binary |
| Output | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |

### Upload Route

#### `POST /api/upload/profile-picture`
Upload user profile picture to InsForge Storage.

| Field | Details |
|-------|---------|
| Input | `multipart/form-data` with image file (JPG/PNG) |
| Process | Validate image -> upload to InsForge Storage `uploads` bucket -> save path to profile |
| Output | `{ url: string }` |

---

## Database Schema

### Entity Relationship Diagram

```
┌──────────────┐       ┌───────────────────┐
│   profiles   │──1:N──│ work_experiences   │
│              │       └───────────────────┘
│  (1 row,     │       ┌───────────────────┐
│   single     │──1:N──│    education       │
│   user)      │       └───────────────────┘
│              │       ┌───────────────────┐
│              │──1:N──│     skills         │
│              │       └───────────────────┘
│              │       ┌───────────────────┐
│              │──1:N──│ job_descriptions   │
│              │       └───────────────────┘
│              │       ┌───────────────────┐
│              │──1:N──│ generated_resumes  │
└──────────────┘       └───────────────────┘

┌──────────────────────┐
│    applications      │  (submitted application tracking)
└──────────────────────┘

┌──────────────────────┐
│ active_applications  │  (interview stage tracking)
└──────────────────────┘

┌──────────────────────┐       ┌───────────────┐
│ messaging_sequences  │──1:N──│   messages     │
└──────────────────────┘       └───────────────┘
```

---

### Table: `profiles`

Single row for the single-user app. Anchor for all profile-related child tables.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| first_name | TEXT | NOT NULL | |
| last_name | TEXT | NOT NULL | |
| email | TEXT | | |
| phone | TEXT | | |
| city | TEXT | | |
| state | TEXT | | |
| portfolio_link | TEXT | | URL |
| linkedin | TEXT | | URL |
| profile_picture_path | TEXT | | InsForge Storage path |
| import_source | TEXT | | 'manual', 'resume_upload', 'linkedin_export' |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### Table: `work_experiences`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| profile_id | UUID | NOT NULL, FK -> profiles(id) ON DELETE CASCADE | |
| company_name | TEXT | NOT NULL | |
| city | TEXT | | |
| state | TEXT | | |
| country | TEXT | | |
| website_link | TEXT | | URL |
| experience_summary | TEXT | | Free-text, multiline |
| sort_order | INTEGER | DEFAULT 0 | User-controlled ordering |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Index:** `idx_work_experiences_profile_id` on `profile_id`

---

### Table: `education`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| profile_id | UUID | NOT NULL, FK -> profiles(id) ON DELETE CASCADE | |
| school_name | TEXT | NOT NULL | |
| city | TEXT | | |
| state | TEXT | | |
| country | TEXT | | |
| degree | TEXT | | |
| sort_order | INTEGER | DEFAULT 0 | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Index:** `idx_education_profile_id` on `profile_id`

---

### Table: `skills`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| profile_id | UUID | NOT NULL, FK -> profiles(id) ON DELETE CASCADE | |
| name | TEXT | NOT NULL | e.g. "JavaScript" |
| category | TEXT | | e.g. "Programming", "Soft Skills" |
| proficiency | TEXT | | e.g. "Expert", "Intermediate" |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Index:** `idx_skills_profile_id` on `profile_id`

---

### Table: `job_descriptions`

Stores job descriptions that the user wants to match against.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| profile_id | UUID | FK -> profiles(id) ON DELETE CASCADE | |
| company_name | TEXT | | |
| role_title | TEXT | | |
| source_url | TEXT | | Original job posting URL |
| raw_text | TEXT | NOT NULL | Full JD text |
| match_score | NUMERIC(5,2) | | AI-computed match % |
| match_analysis | JSONB | | `{ matchedSkills, missingSkills, recommendations, summary }` |
| status | TEXT | DEFAULT 'pending' | pending, matched, resume_generated, applied |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Index:** `idx_job_descriptions_profile_id` on `profile_id`

---

### Table: `generated_resumes`

Stores AI-generated resume content, linked to a profile + job description pair.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| profile_id | UUID | FK -> profiles(id) ON DELETE CASCADE | |
| job_description_id | UUID | FK -> job_descriptions(id) ON DELETE SET NULL | |
| content | JSONB | NOT NULL | Structured resume: `{ summary, experience[], education[], skills[], highlights[] }` |
| pdf_storage_path | TEXT | | InsForge Storage path after download |
| docx_storage_path | TEXT | | InsForge Storage path after download |
| include_photo | BOOLEAN | DEFAULT false | Whether profile picture was included |
| version | INTEGER | DEFAULT 1 | Resume revision number |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Index:** `idx_generated_resumes_profile_id` on `profile_id`

---

### Table: `applications`

Tracks all submitted job applications in a spreadsheet-like format.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| company_name | TEXT | NOT NULL | |
| job_id | TEXT | | External job posting ID |
| job_description | TEXT | | Full JD text |
| job_description_id | UUID | FK -> job_descriptions(id) ON DELETE SET NULL | Link to analyzed JD |
| resume_submitted | TEXT | | Storage path of submitted resume |
| generated_resume_id | UUID | FK -> generated_resumes(id) ON DELETE SET NULL | Link to generated resume |
| status | TEXT | DEFAULT 'saved' | CHECK: saved, applied, interviewing, offered, rejected, withdrawn |
| referral | TEXT | | Referral name/contact |
| comments | TEXT | | Free-text notes |
| match_score | NUMERIC(5,2) | | AI-computed ATS match % |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Check constraint:** `status IN ('saved', 'applied', 'interviewing', 'offered', 'rejected', 'withdrawn')`

---

### Table: `active_applications`

Tracks applications actively in interview pipeline with granular stage tracking.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| company_name | TEXT | NOT NULL | |
| status | TEXT | NOT NULL | Phone Screen, Round 1, Round 2, Round 3, Final, Offer, Declined |
| role | TEXT | | Job title/position |
| recruiter | TEXT | | Recruiter/hiring manager name |
| resume_submitted | TEXT | | Which resume version |
| referral | TEXT | | |
| last_contact_date | DATE | | Last interaction date |
| notes | TEXT | | Free-text notes |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### Table: `messaging_sequences`

Groups messages into outreach sequences per company/role.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| company_name | TEXT | | Associated company |
| role | TEXT | | Associated role |
| recruiter_email | TEXT | NOT NULL | Target recruiter email |
| recruiter_name | TEXT | | Recruiter name |
| status | TEXT | DEFAULT 'draft' | draft, active, completed, paused |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### Table: `messages`

Individual messages within a sequence.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| sequence_id | UUID | NOT NULL, FK -> messaging_sequences(id) ON DELETE CASCADE | |
| stage | TEXT | NOT NULL | initial_outreach, follow_up_1, follow_up_2, thank_you, etc. |
| prompt | TEXT | | User's prompt/context for generation |
| generated_content | TEXT | | AI-generated email content |
| status | TEXT | DEFAULT 'draft' | draft, sent, replied |
| sent_at | TIMESTAMPTZ | | When the email was sent |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Index:** `idx_messages_sequence_id` on `sequence_id`

---

## SQL Creation Script

```sql
-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  city TEXT,
  state TEXT,
  portfolio_link TEXT,
  linkedin TEXT,
  profile_picture_path TEXT,
  import_source TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- work_experiences
CREATE TABLE IF NOT EXISTS work_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  country TEXT,
  website_link TEXT,
  experience_summary TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_work_experiences_profile_id ON work_experiences(profile_id);

-- education
CREATE TABLE IF NOT EXISTS education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  country TEXT,
  degree TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_education_profile_id ON education(profile_id);

-- skills
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  proficiency TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_skills_profile_id ON skills(profile_id);

-- job_descriptions
CREATE TABLE IF NOT EXISTS job_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT,
  role_title TEXT,
  source_url TEXT,
  raw_text TEXT NOT NULL,
  match_score NUMERIC(5,2),
  match_analysis JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_profile_id ON job_descriptions(profile_id);

-- generated_resumes
CREATE TABLE IF NOT EXISTS generated_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_description_id UUID REFERENCES job_descriptions(id) ON DELETE SET NULL,
  content JSONB NOT NULL,
  pdf_storage_path TEXT,
  docx_storage_path TEXT,
  include_photo BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_generated_resumes_profile_id ON generated_resumes(profile_id);

-- applications (submitted application tracking)
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  job_id TEXT,
  job_description TEXT,
  job_description_id UUID REFERENCES job_descriptions(id) ON DELETE SET NULL,
  resume_submitted TEXT,
  generated_resume_id UUID REFERENCES generated_resumes(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'saved' CHECK (status IN ('saved', 'applied', 'interviewing', 'offered', 'rejected', 'withdrawn')),
  referral TEXT,
  comments TEXT,
  match_score NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- active_applications (interview stage tracking)
CREATE TABLE IF NOT EXISTS active_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  status TEXT NOT NULL,
  role TEXT,
  recruiter TEXT,
  resume_submitted TEXT,
  referral TEXT,
  last_contact_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- messaging_sequences
CREATE TABLE IF NOT EXISTS messaging_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT,
  role TEXT,
  recruiter_email TEXT NOT NULL,
  recruiter_name TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES messaging_sequences(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  prompt TEXT,
  generated_content TEXT,
  status TEXT DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_sequence_id ON messages(sequence_id);
```

---

## Storage

### Bucket: `uploads`

Stores user-uploaded files (source material for profile building).

| Property | Value |
|----------|-------|
| Bucket name | `uploads` |
| Public | No |
| Contents | Uploaded resumes (PDF/DOCX), LinkedIn export PDFs, profile pictures (JPG/PNG) |
| File naming | `{type}/{profile_id}/{timestamp}.{ext}` (e.g. `resumes/abc-123/1711612800.pdf`) |

### Bucket: `resumes`

Stores AI-generated resume files after user downloads them.

| Property | Value |
|----------|-------|
| Bucket name | `resumes` |
| Public | No |
| Contents | Generated PDF and DOCX files |
| File naming | `{profile_id}/{job_desc_id}/{version}.{ext}` |

---

## AI Integration (OpenAI GPT-4o)

### Skill Matching

**Endpoint:** `POST /api/ai/match`

Prompt strategy:
1. Send user's full profile (skills, experience, education) + job description text
2. Ask GPT-4o to analyze and return structured JSON:
   - `matchScore` (0-100): overall match percentage
   - `matchedSkills[]`: skills the user has that match JD requirements
   - `missingSkills[]`: JD requirements the user lacks
   - `recommendations[]`: suggestions to strengthen the application
   - `summary`: brief natural-language analysis

### Resume Generation

**Endpoint:** `POST /api/ai/generate-resume`

Prompt strategy:
1. Send user profile + target JD + match analysis
2. Ask GPT-4o to generate tailored resume content as structured JSON:
   - `summary`: professional summary paragraph tailored to the role
   - `experience[]`: rewritten work experience bullets emphasizing relevant skills
   - `education[]`: education entries
   - `skills[]`: curated and prioritized skill list
   - `highlights[]`: key achievements relevant to the JD
3. Uses streaming (Server-Sent Events) so the frontend can show a progress bar

### Email Generation

**Endpoint:** `POST /api/ai/generate-email`

Prompt strategy:
1. Send context: company, role, recruiter info, stage, user prompt
2. Ask GPT-4o to generate a professional email with subject line and body

### Environment Variables

```env
OPENAI_API_KEY=sk-...
```

---

## CRUD Patterns (InsForge SDK)

All database operations go through InsForge auto-REST API via the SDK:

```typescript
// Profile with nested data
insforge.database.from('profiles')
  .select('*, work_experiences(*), education(*), skills(*)')
  .single()

// Job descriptions for a profile
insforge.database.from('job_descriptions')
  .select('*')
  .eq('profile_id', profileId)
  .order('created_at', { ascending: false })

// Generated resumes with linked JD
insforge.database.from('generated_resumes')
  .select('*, job_descriptions(*)')
  .eq('profile_id', profileId)

// Messaging sequences with messages
insforge.database.from('messaging_sequences')
  .select('*, messages(*)')
  .order('created_at', { ascending: false })
```

---

## Security

| Concern | Approach |
|---------|----------|
| Authentication | None (single-user app) |
| Row Level Security | Disabled on all tables |
| API Access | InsForge anonymous JWT (never-expiring) |
| OpenAI API Key | Server-side only (never exposed to client) |
| File Uploads | Validated server-side (type, size limits) |
| Environment Variables | `.env.local`, not committed |

---

## Docker

Single container for the Next.js app (InsForge is cloud-hosted):

```
┌───────────────────────┐         ┌─────────────────────┐
│  Docker Container     │         │  Cloud Services     │
│                       │         │                     │
│  Next.js App          │────────▶│  InsForge BaaS      │
│  (React + API Routes) │         │  (DB + Storage)     │
│                       │────────▶│                     │
│  Port 3000            │         │  OpenAI API         │
└───────────────────────┘         └─────────────────────┘
```

`next.config.ts` uses `output: 'standalone'` for optimized Docker builds.
