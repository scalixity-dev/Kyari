# Kyaari OMS

Monorepo containing frontend (Vite + React + TypeScript + Tailwind) and a Node/Express backend.

## Prerequisites
- Node.js 18+
- npm 9+

## Quick start

### 1) Install dependencies (root and backend share lockfiles)
```bash
npm install
cd backend && npm install
```

### 2) Start the frontend
From project root:
```bash
npm run dev
```
Vite serves at `http://localhost:5173` by default.

### 3) Start the backend API
From `backend/` directory:
```bash
npm run dev
```
Runs Express with nodemon at `http://localhost:3000` (see `backend/server.js`).

## Scripts
Frontend (root package.json):
- `npm run dev` — start Vite dev server
- `npm run build` — type-check and build
- `npm run preview` — preview production build

Backend (`backend/package.json`):
- `npm run dev` — start nodemon dev server
- `npm start` — start Node server

## Frontend structure
- `src/pages/Landing.tsx` — landing page to choose dashboard
- `src/dashboards/admin/AdminLayout.tsx`
- `src/dashboards/vendors/VendorsLayout.tsx`
- `src/dashboards/accounts/AccountsLayout.tsx`
- `src/dashboards/operations/OperationsLayout.tsx`
- `src/App.tsx` — routes

## Tech
- React 19, React Router
- Tailwind CSS via `@tailwindcss/vite`
- Vite 7

## Environment
Backend can read environment variables via `dotenv`. Create `backend/.env` if needed and read in `backend/server.js`.
