# Flowtives

> *Time cannot be made, only spent. Flowtives is an attempt to help people spend it with a little more care.*

Flowtives is an AI-powered schedule and time management web app. It helps users organise their calendar, manage tasks, and plan their time effectively.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | FastAPI (Python) |
| Database & Auth | Supabase (PostgreSQL) |
| UI Icons | Lucide React |

---

## Project Structure

```
Flowtives/
├── src/
│   ├── app/
│   │   ├── calendar/          ← Calendar page & components
│   │   ├── signin/            ← Sign in page
│   │   ├── signup/            ← Sign up page
│   │   ├── components/        ← Shared components
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx           ← Landing page
│   └── context/
│       └── AuthContext.tsx    ← Global auth state
├── public/
├── backend/
│   ├── routes/
│   │   ├── __init__.py
│   │   └── auth.py            ← Sign in / Sign up endpoints
│   ├── main.py                ← FastAPI app entry point
│   ├── requirements.txt
│   └── .env                   ← Backend secrets (not in repo)
├── .env.local                 ← Frontend secrets (not in repo)
└── package.json
```

---

## Prerequisites

Make sure you have these installed before starting:

- [Node.js](https://nodejs.org) v18 or higher
- [Python](https://python.org) v3.10 or higher
- [Git](https://git-scm.com)

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Flowtives
```

---

### 2. Frontend Setup

Install dependencies:

```bash
npm install
```

Create a `.env.local` file in the root `Flowtives/` folder:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000
```

> Get the Supabase URL and Anon Key from: **Supabase Dashboard → Project Settings → API**

---

### 3. Backend Setup

Navigate to the backend folder and create a virtual environment:

```bash
cd backend

# Create venv
python3 -m venv venv

# Activate it
source venv/bin/activate        # macOS / Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

> ⚠️ Use the same Supabase keys as the frontend. The `NEXT_PUBLIC_` prefix is for Next.js only — do NOT add it here.

---

## Running the App

You need **two terminals** running simultaneously.

### Terminal 1 — FastAPI Backend

```bash
cd backend
source venv/bin/activate    # Windows: venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

- Backend runs at: `http://localhost:8000`
- Swagger API docs: `http://localhost:8000/docs`

### Terminal 2 — Next.js Frontend

```bash
# From the root Flowtives/ folder
npm run dev
```

- Frontend runs at: `http://localhost:3000`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/auth/signup` | Register a new user |
| `POST` | `/auth/signin` | Sign in and get JWT token |
| `POST` | `/auth/signout` | Sign out current user |

### Request body for `/auth/signup` and `/auth/signin`

```json
{
  "email": "you@example.com",
  "password": "yourpassword"
}
```

### Response from `/auth/signin`

```json
{
  "access_token": "eyJhbG...",
  "refresh_token": "...",
  "user_id": "uuid",
  "email": "you@example.com"
}
```

---

## Supabase Configuration

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **Authentication → Email** and configure:
   - **Confirm email** → ON (recommended for production)
3. Go to **Authentication → URL Configuration** and set:
   - **Site URL** → `http://localhost:3000`
   - **Redirect URLs** → `http://localhost:3000/**`

---

## Environment Variables Reference

### `Flowtives/.env.local` (Frontend)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase public anon key |
| `NEXT_PUBLIC_FASTAPI_URL` | URL of the running FastAPI backend |

### `backend/.env` (Backend)

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase public anon key |

> ⚠️ **Never commit `.env` or `.env.local` to Git.** They are listed in `.gitignore`.

---

## Notes

- The access token returned on sign in is a **JWT** — stored in `localStorage` on the client
- Passwords are **never stored in plain text** — Supabase hashes them with bcrypt automatically
- All connections are over **HTTPS** in production

---

## Authors

Flowtives Team
