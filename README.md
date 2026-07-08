# Gym Management Project

Simple full-stack gym management app for presentation/demo.

## Stack
- Node.js + Express
- MongoDB + Mongoose
- Vanilla HTML/CSS/JS frontend

## Features
- Secure auth with `bcryptjs` password hashing
- JWT-based login sessions
- Role-based permissions (`admin`, `trainer`, `student`)
- Trainer, student, workout, and schedule management
- Dashboard insights (totals, top specialization, today sessions)
- Sample database seeder for quick demo setup

## Run Locally
1. Open terminal in `server`.
2. Install dependencies:
   - `npm install`
3. Create env file:
   - Copy `.env.example` to `.env`
4. Seed sample data:
   - `npm run seed`
5. Start server:
   - `npm run dev`
6. Open:
   - `http://localhost:5000`

## Demo Login Credentials
- `admin` / `password123`
- `trainer1` / `password123`
- `student1` / `password123`

## API Notes
- After login/register, use token from response.
- Pass token in header:
  - `Authorization: Bearer <token>`
