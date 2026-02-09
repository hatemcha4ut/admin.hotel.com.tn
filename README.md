# admin.hotel.com.tn

Admin portal interface for hotel management backoffice.

## Architecture Overview

This admin portal is part of a multi-domain hotel management system:

- **`www.hotel.com.tn`** - Public-facing website for hotel information and bookings
- **`api.hotel.com.tn`** - Backend API server handling business logic and data access
- **`admin.hotel.com.tn`** - Admin portal (this repository) for backoffice management

The admin portal uses **React 19 + Vite 7 + TypeScript** with **react-router-dom v7** (BrowserRouter) for routing and **Supabase Auth** for authentication and role-based access control.

## Authentication & Authorization

### Supabase Auth Setup

Configure the Supabase credentials before running the app:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Admin Access Control

The app uses a `RequireAdmin` component guard that checks the `admin_users` table in Supabase. Only users present in this table can access the admin interface.

**Required `admin_users` table schema:**

| column | type | description |
| --- | --- | --- |
| `email` | text | User's email address (must match Supabase Auth email) |
| `role` | text | Role identifier (e.g., 'admin', 'manager', 'viewer') |

The UI adapts navigation and features based on the user's `role` value.

### Auth Flow

1. User signs in via `/login` page using Supabase Auth
2. `useAuth()` hook checks if user's session exists
3. `RequireAdmin` guard queries `admin_users` table for the authenticated email
4. If user is found in `admin_users`, access is granted
5. Otherwise, user is redirected to `/access-denied`

## How to run locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## How to deploy

The application is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

### Manual deployment steps:

1. Build the project:
   ```bash
   npm run build
   ```

2. The build output will be in the `dist/` directory.

3. GitHub Actions will automatically:
   - Build the project
   - Upload the `dist/` directory
   - Deploy to GitHub Pages

### Setting up custom domain

After deployment, you can configure a custom domain (`admin.hotel.com.tn`) in your repository settings:
- Go to Settings > Pages
- Add your custom domain under "Custom domain"
- Configure your DNS settings to point to GitHub Pages

### GitHub Pages SPA Routing

Since GitHub Pages doesn't support server-side routing for SPAs, this repository implements a workaround:

1. **`public/404.html`** - Redirects all 404 requests to `index.html` while preserving the path
2. **Redirect decoder in `index.html`** - Decodes the path and updates browser history without triggering a page reload

This allows direct navigation to routes like `/reservations` or `/settings` without getting a 404 error from GitHub Pages.

**Technical details:**
- Based on [spa-github-pages](https://github.com/rafgraph/spa-github-pages) technique
- Uses URL encoding (`~and~` for `&`) to preserve query parameters
- Maintains browser history and back button functionality

## Tech Stack

- **Vite 7** - Build tool and dev server
- **React 19** - UI library
- **TypeScript** - Type safety
- **react-router-dom v7** - Client-side routing (BrowserRouter)
- **Supabase Auth** - Authentication and user management
- **GitHub Pages** - Hosting with custom domain support
