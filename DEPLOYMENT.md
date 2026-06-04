# Deployment & GitHub Integration Guide - AproFlow

This guide explains how to connect your **AproFlow** repository to GitHub, why standard static website hosts like **GitHub Pages (`github.io`)** return a `404 Not Found` error for this application, and how to successfully host your full-stack application.

---

## 1. Why does `github.io` return a 404 Error?

**GitHub Pages (`github.io`)** is designed solely for serving **static client-side files** (HTML, CSS, JS, and images). 

AproFlow is an enterprise-grade **full-stack application** that includes:
- An **Express.js backend server** (`server.ts`) responsible for handling API routers.
- Direct **Firebase / Firestore backend synchronization** and routing logic.
- A secure compilation step where Node.js compiles and routes traffic at runtime.

Since GitHub Pages lacks a server-side Node.js environment to run the Express backend, trying to serve it as a static site will either result in a `404 Not Found` or cause backend errors when contacting any server endpoints.

---

## 2. Moving Your Project to GitHub (Export)

You can easily sync this codebase to your own GitHub account:

1. Locate the **Settings** menu at the top-right corner of the **Google AI Studio Build** console.
2. Select **Export to GitHub**.
3. Authorize your GitHub account when prompted, and select/create a repository (public or private) to push this codebase.
4. AI Studio will automatically push your committed code directly to your GitHub repository.

---

## 3. Recommended Full-Stack Hosting Platforms

To successfully run both the React frontend and Express backend, use a platform supporting standard Node.js full-stack deployments:

### Option A: Render (Web Service) - *Recommended / Free-Tier Friendly*
Render is highly popular and easily supports Node.js monorepos and full-stack servers.
1. Sign up on [Render.com](https://render.com) and link your GitHub account.
2. Click **New +** and select **Web Service**.
3. Connect your exported AproFlow GitHub repository.
4. Use the following build and run settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start` (or `node dist/server.cjs` as declared in `package.json`)
5. In the **Environment Variables** tab, define your required variables (e.g., `GEMINI_API_KEY`, `APP_URL`).

### Option B: Railway (Express/Node.js Container) - *Fastest Setup*
Railway is an intuitive platform that auto-detects `package.json` scripts and deploys them inside a production container.
1. Go to [Railway.app](https://railway.app/) and authenticate with GitHub.
2. Select **New Project** -> **Deploy from GitHub repo** and connect your repository.
3. Under variables, supply your secret environment variables.
4. Railway will auto-detect the build & start scripts from `package.json` and host it securely on persistent hosting with public custom domain URLs.

### Option C: Google Cloud Run - *Enterprise-Grade / Built-In*
Your application is natively prepared to be containerized using Google Cloud Run, exactly as it is run inside this development preview container.
- Build a standard Docker container of this directory.
- Expose Port `3000` (which is configured in `vite.config.ts` and `server.ts`).
- Set environment variables during container setup in the Google Cloud Console.

---

## 4. Run & Test Locally

If you clone your repository from GitHub to your local machine, you can run the full-stack server locally:

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (Vite + Express via tsx)
npm run dev
```
Your local terminal will mount the development environment at **`http://localhost:3000`** with live reloading.
