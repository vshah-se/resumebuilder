# Frontend Architecture -- ResumeForge

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.x |
| UI Library | Material UI (MUI) | 7.x |
| Language | TypeScript | 5.x |
| Runtime | React | 19.x |
| Styling | Emotion | 11.x |
| Backend Client | InsForge JavaScript SDK | |
| Containerization | Docker (multi-stage) | |

---

## Updated User Flow (3-Step Process)

```
┌─────────────────────────────────────────────────────────┐
│  STEP 1: PROFILE CREATION                               │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Upload Resume │  │ Upload       │  │ Manual Entry │  │
│  │ (PDF/DOCX)   │  │ LinkedIn PDF │  │ (Form)       │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│         └────────┬────────┘                  │          │
│                  ▼                           │          │
│         AI extracts data                     │          │
│         from uploaded file                   │          │
│                  │                           │          │
│                  └───────────┬───────────────┘          │
│                              ▼                          │
│                    Profile form pre-filled               │
│                    User reviews & edits                  │
│                    Saves to database                     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 2: JOB DESCRIPTION                               │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │ Paste JD URL │  │ Paste JD     │                    │
│  │              │  │ Text         │                    │
│  └──────┬───────┘  └──────┬───────┘                    │
│         └────────┬────────┘                             │
│                  ▼                                      │
│         Save JD to database                             │
│                  │                                      │
│                  ▼                                      │
│         AI analyzes: match score,                       │
│         matched/missing skills,                         │
│         recommendations                                │
│                  │                                      │
│                  ▼                                      │
│         Display results on UI                           │
│         User confirms to proceed                        │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 3: RESUME GENERATION                              │
│                                                         │
│         Progress bar shown during AI generation         │
│                  │                                      │
│                  ▼                                      │
│         Resume preview in browser                       │
│         (with profile picture option)                   │
│                  │                                      │
│                  ▼                                      │
│         Download as PDF or DOCX                         │
│         (ATS-friendly output)                           │
│                  │                                      │
│                  ▼                                      │
│         Application tracking updated                    │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
frontend/src/
├── app/
│   ├── layout.tsx                          # Root layout: ThemeProvider + AppShell + Notifications
│   ├── page.tsx                            # Dashboard
│   ├── profile/
│   │   └── page.tsx                        # Profile creation (upload + form)
│   ├── jobs/
│   │   └── page.tsx                        # Job description input + AI matching
│   ├── resume/
│   │   └── page.tsx                        # Resume preview + export
│   ├── applications/
│   │   └── page.tsx                        # Application tracking (spreadsheet)
│   ├── active/
│   │   └── page.tsx                        # Active applications (interview stages)
│   ├── messaging/
│   │   └── page.tsx                        # Messaging sequences
│   └── api/
│       ├── import/
│       │   ├── resume/route.ts             # Parse uploaded PDF/DOCX resume
│       │   └── linkedin/route.ts           # Parse LinkedIn export PDF
│       ├── ai/
│       │   ├── match/route.ts              # AI skill matching
│       │   ├── generate-resume/route.ts    # AI resume generation (SSE streaming)
│       │   └── generate-email/route.ts     # AI email generation
│       ├── resume/
│       │   ├── pdf/route.ts                # ATS-friendly PDF generation
│       │   └── docx/route.ts               # ATS-friendly DOCX generation
│       └── upload/
│           └── profile-picture/route.ts    # Profile picture upload
│
├── components/
│   ├── common/
│   │   ├── AppShell.tsx                    # AppBar + Sidebar drawer
│   │   ├── NotificationProvider.tsx        # Snackbar toast context
│   │   ├── PageContainer.tsx               # Standard page wrapper
│   │   └── FileUploadZone.tsx              # Drag-and-drop file upload component
│   ├── profile/
│   │   ├── ImportOptions.tsx               # Upload resume / LinkedIn / manual toggle
│   │   ├── PersonalInfoForm.tsx            # Name, email, phone, city/state, links
│   │   ├── WorkExperienceForm.tsx          # Repeatable job cards (add/delete)
│   │   ├── EducationForm.tsx               # Repeatable education cards
│   │   ├── SkillsInput.tsx                 # Autocomplete + chips
│   │   └── ProfilePictureUpload.tsx        # Profile picture upload + preview
│   ├── jobs/
│   │   ├── JobDescriptionInput.tsx         # URL or text input for JD
│   │   ├── MatchResults.tsx                # Match score, skills analysis display
│   │   └── JobHistoryTable.tsx             # List of previously analyzed JDs
│   ├── resume/
│   │   ├── ResumePreview.tsx               # Formatted resume display (with photo)
│   │   ├── ExportActions.tsx               # Download PDF / DOCX buttons
│   │   └── GenerationProgress.tsx          # Progress bar during AI generation
│   ├── applications/
│   │   ├── ApplicationTable.tsx            # Spreadsheet-style DataGrid
│   │   └── ApplicationFormDialog.tsx       # Add/edit application modal
│   ├── active/
│   │   ├── ActiveApplicationTable.tsx      # Interview stage tracking table
│   │   └── ActiveApplicationFormDialog.tsx # Add/edit modal
│   └── messaging/
│       ├── MessageComposer.tsx             # Email + prompt input form
│       ├── MessagePreview.tsx              # Generated email preview
│       └── SequenceTracker.tsx             # Stage tracking list
│
├── services/
│   ├── profileService.ts                   # Profile CRUD (upsert pattern)
│   ├── workExperienceService.ts            # Work experience CRUD
│   ├── educationService.ts                 # Education CRUD
│   ├── skillsService.ts                    # Skills sync
│   ├── jobDescriptionService.ts            # Job descriptions CRUD
│   ├── generatedResumeService.ts           # Generated resumes CRUD
│   ├── applicationService.ts               # Application tracking CRUD
│   ├── activeApplicationService.ts         # Active applications CRUD
│   └── messagingService.ts                 # Messaging sequences + messages CRUD
│
├── hooks/
│   ├── useProfile.ts                       # Fetch/save full profile data
│   └── useNotification.ts                  # Notification context
│
├── lib/
│   ├── insforge.ts                         # InsForge SDK client init
│   ├── theme.ts                            # MUI theme (design tokens)
│   └── constants.ts                        # Nav items, skill suggestions, status options
│
├── types/
│   ├── profile.ts                          # Profile, WorkExperience, Education, Skill, FullProfile
│   ├── application.ts                      # Application interface
│   ├── activeApplication.ts                # ActiveApplication interface
│   ├── jobDescription.ts                   # JobDescription + MatchAnalysis interfaces
│   ├── generatedResume.ts                  # GeneratedResume interface
│   └── messaging.ts                        # MessagingSequence, Message interfaces
│
└── utils/
    └── validation.ts                       # Form validation helpers
```

---

## Navigation

| Route | Label | Icon | Description |
|-------|-------|------|-------------|
| `/` | Dashboard | SpaceDashboardOutlined | Overview, stats, quick actions |
| `/profile` | Profile | PersonOutlined | Upload resume/LinkedIn + edit profile |
| `/jobs` | Job Match | WorkOutlineOutlined | Input JD, view AI skill matching |
| `/resume` | Resume | DescriptionOutlined | Preview + download generated resume |
| `/applications` | Applications | AssignmentOutlined | Spreadsheet tracking of submitted apps |
| `/active` | Active | TrackChangesOutlined | Interview stage tracking |
| `/messaging` | Messaging | EmailOutlined | Recruiter email sequences |

---

## Page Details

### 1. Dashboard (`/`)

- Profile summary card (or "Get Started" CTA if no profile)
- Stats: total applications, active interviews, match scores, messages sent
- Quick-action cards: Import Resume, Match Job, Generate Resume

### 2. Profile (`/profile`)

**Three import methods** (shown as tabs or toggle):
1. **Upload Resume** -- drag-and-drop PDF/DOCX -> calls `/api/import/resume` -> pre-fills form
2. **Upload LinkedIn Export** -- drag-and-drop LinkedIn PDF -> calls `/api/import/linkedin` -> pre-fills form
3. **Manual Entry** -- empty form for manual input

After import, user reviews and edits data in accordion sections:
- Personal Info (with profile picture upload)
- Work Experience (repeatable cards)
- Education (repeatable cards)
- Skills (autocomplete + chips with category/proficiency)

### 3. Job Match (`/jobs`)

- **Input area**: paste job URL or job description text
- **Submit** -> saves JD to `job_descriptions` table -> calls `/api/ai/match`
- **Results display**:
  - Match score (circular gauge, 0-100%)
  - Matched skills (green chips)
  - Missing skills (red chips)
  - Recommendations list
  - Summary paragraph
- **Action button**: "Generate Resume for This Job" -> proceeds to Step 3
- **History table**: previously analyzed job descriptions with scores

### 4. Resume (`/resume`)

- **Generation progress bar** (shown during AI generation via SSE streaming)
- **Resume preview**: formatted display in browser
  - Includes profile picture if user opted in
  - Professional layout matching the PDF/DOCX output
- **Export actions**: "Download PDF" and "Download DOCX" buttons
- **Version history**: list of previously generated resumes

### 5. Application Tracking (`/applications`)

MUI DataGrid spreadsheet view with columns:
Company Name, Job ID, Job Description, Resume Submitted, Status, Referral, Comments, Match Score

- Add new application via dialog
- Inline editing for quick updates
- Auto-populated when user downloads a generated resume

### 6. Active Applications (`/active`)

Table tracking interview stages:
Company Name, Status (Phone Screen/Round 1-3/Final/Offer), Role, Recruiter, Resume, Referral, Last Contact Date, Notes

- Color-coded status chips
- Add/edit via dialog

### 7. Messaging (`/messaging`)

- Create new sequence: recruiter email + prompt
- AI generates customized email -> displayed in preview
- Stage tracking: initial outreach, follow-up 1, follow-up 2, thank you, etc.

---

## Design System

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| Navy | `#1a2332` | Primary, text, sidebar |
| Navy Light | `#243044` | Primary hover |
| Teal | `#2dd4bf` | Secondary/accent, active states |
| Teal Dark | `#14b8a6` | Secondary hover |
| Slate | `#64748b` | Secondary text |
| Off-White | `#f8fafc` | Page background |
| White | `#ffffff` | Card backgrounds |
| Border | `#e2e8f0` | Dividers, card borders |
| Success | `#22c55e` | Positive status, matched skills |
| Warning | `#f59e0b` | Pending status |
| Error | `#ef4444` | Negative status, missing skills |

### Component Overrides

- **Buttons:** Gradient backgrounds, subtle hover lift, no elevation
- **Cards:** 1px border, 12px radius, subtle hover shadow
- **TextFields:** 8px radius, teal focus border
- **Chips:** 6px radius, color-coded by context (skills green, missing red)
- **Accordion:** No separator, 12px radius, 12px gap
- **AppBar:** Frosted glass (backdrop-filter blur)
- **Progress bar:** Teal gradient, animated

---

## Data Flow

### Profile Import Flow
```
FileUploadZone (drag-and-drop)
  │
  ▼
POST /api/import/resume  (or /linkedin)
  │
  ▼
API Route: parse file -> OpenAI extracts structured data -> return JSON
  │
  ▼
Pre-fill profile form -> user reviews/edits -> save via InsForge SDK
```

### Job Match + Resume Generation Flow
```
JobDescriptionInput (paste URL or text)
  │
  ▼
Save to job_descriptions table (InsForge SDK)
  │
  ▼
POST /api/ai/match (profile + JD -> OpenAI -> match analysis)
  │
  ▼
MatchResults displayed -> user clicks "Generate Resume"
  │
  ▼
POST /api/ai/generate-resume (SSE streaming -> progress bar)
  │
  ▼
Save to generated_resumes table -> ResumePreview displayed
  │
  ▼
User clicks Download -> POST /api/resume/pdf or /docx
  │
  ▼
File saved to InsForge Storage -> application record created/updated
```

---

## Environment Variables

```env
# Server-side only
INSFORGE_BASE_URL=https://your-app.insforge.app
INSFORGE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-...

# Client-side
NEXT_PUBLIC_INSFORGE_BASE_URL=https://your-app.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=your-anon-key
```

---

## Docker

Single container with Next.js (standalone output):

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Accessible at `http://localhost:3000`.
