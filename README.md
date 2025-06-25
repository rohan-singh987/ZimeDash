# Project Management Dashboard

A full-stack project management application with role-based access control. Built with Next.js (frontend) and Express.js (backend).

## Features

- **Authentication**: JWT-based login/register
- **Roles**: Admin, Manager, Member with different permissions
- **Projects**: Create, manage, and track project progress
- **Tasks**: Assign tasks, update status, set priorities
- **Users**: Admin can manage users and roles

## Tech Stack

- **Backend**: Express.js, MongoDB, JWT, bcryptjs
- **Frontend**: Next.js 15, React 19, Tailwind CSS 4, Axios

## Setup

### Prerequisites
- Node.js 16+
- MongoDB Atlas account

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables

**Backend** - Create `backend/.env`:
```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Frontend** - Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Run Application
```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## API Endpoints

### Authentication `/api/auth`
- `POST /register` - Register user
- `POST /login` - Login user
- `GET /me` - Get profile
- `POST /setup-admin` - Create first admin

### Users `/api/users` (Admin/Manager)
- `GET /` - List users
- `GET /stats` - User stats
- `PUT /:id/role` - Change user role
- `DELETE /:id` - Delete user

### Projects `/api/projects`
- `GET /` - List projects
- `POST /` - Create project (Admin only)
- `GET /:id` - Get project
- `PUT /:id` - Update project
- `DELETE /:id` - Delete project (Admin only)

### Tasks `/api/tasks`
- `GET /my-tasks` - My assigned tasks
- `GET /project/:id` - Project tasks
- `POST /` - Create task
- `PUT /:id` - Update task
- `DELETE /:id` - Delete task

## User Roles

- **Admin**: Full access to everything
- **Manager**: Manage assigned projects and tasks
- **Member**: View assigned projects, update own task status

## Project Structure

```
zime/
├── backend/          # Express.js API
│   ├── controllers/  # Route handlers
│   ├── models/       # MongoDB schemas
│   ├── routes/       # API routes
│   └── middlewares/  # Auth & validation
├── frontend/         # Next.js app
│   └── src/
│       ├── app/      # Pages
│       ├── components/ # UI components
│       └── lib/      # API client
└── package.json      # Monorepo setup
```

## Development Commands

```bash
# Run both frontend and backend
npm run dev

# Backend only
cd backend && npm run dev

# Frontend only  
cd frontend && npm run dev
```

## Database Schema

**Users**: name, email, password, role, isActive  
**Projects**: name, description, status, priority, members, createdBy  
**Tasks**: title, description, status, priority, projectId, assignedTo, createdBy 