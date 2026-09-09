# TFBE Roadmap

This is the repository for the **TFBE Roadmap** application. It consists of a React frontend and a Node.js/Express backend, using PostgreSQL for the database and Vercel for deployment.

## Project Structure

The project is structured as a monorepo containing both the frontend and the backend.

- `client/`: Contains the frontend application (React).
- `api/`: Contains the backend API (Node.js, Express, PostgreSQL).

## Prerequisites

- Node.js (v18 or higher recommended)
- PostgreSQL database
- npm or yarn

## Getting Started

### 1. Installation

Install dependencies for the root, frontend, and backend:

```bash
npm install
cd client && npm install
cd ../api && npm install
```

### 2. Environment Variables

You will need to set up environment variables for both the client and the api.

**Backend (`api/`)**
1. Navigate to the `api` directory.
2. Copy the `.env.example` file to create a `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Update the variables in `api/.env` with your PostgreSQL database connection string and other secrets (e.g. JWT secret).

**Frontend (`client/`)**
1. Check if there is a `.env` or `.env.example` file in the `client` directory and configure it as needed. Usually, it points to the API URL (e.g., `VITE_API_URL=http://localhost:3000`).

### 3. Database Migration

To initialize your database, you may need to run the migrations located in the `api` folder:

```bash
cd api
npm run migrate
```
*(Check `api/package.json` for other specific migration scripts like `migrate:v2`, etc.)*

### 4. Running the Development Servers

You will need two terminal windows to run both the frontend and the backend simultaneously.

**Start the Backend:**
```bash
cd api
npm run dev
```

**Start the Frontend:**
```bash
# From the root directory:
npm run dev

# Or from the client directory:
cd client
npm run dev
```

## Deployment

This project is configured to be deployed on **Vercel**. Check the `vercel.json` files in the root and `api/` directories for configuration details.

## License

*(Add License Information Here)*
