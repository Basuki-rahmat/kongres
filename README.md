# Kongres API

Backend application built with **Bun**, **ElysiaJS**, **Drizzle ORM**, and **MySQL**.

## Tech Stack
- **Runtime:** [Bun](https://bun.sh)
- **Web Framework:** [ElysiaJS](https://elysiajs.com)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team)
- **Database:** MySQL

## Getting Started

### 1. Install Dependencies
```bash
bun install
```

### 2. Environment Variables
Copy `.env.example` to `.env` and adjust database credentials if necessary:
```bash
cp .env.example .env
```

### 3. Database Migration
Push the Drizzle schema to your MySQL database:
```bash
bun run db:push
```

### 4. Run Development Server
```bash
bun run dev
```
Server runs at `http://localhost:3000`.

## Scripts
- `bun run dev` - Start dev server with hot reload
- `bun run db:generate` - Generate SQL migration files
- `bun run db:push` - Directly push schema changes to DB
- `bun run db:studio` - Open Drizzle Studio visual interface
