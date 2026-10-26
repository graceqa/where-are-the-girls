# Where are the girls? 👯‍♀️🗓️

A shared custody & daily activity calendar web application designed for co-parents **Grace** and **Ronny** to track **Gabby & Penny's** schedule across multiple Google Calendars.

---

## Features

- **Mobile-Optimized Single-Screen View**:
  - Prominently displays which parent the girls are with (*With Grace* or *With Ronny*).
  - Displays **Airplane Icon (`✈️`) and `traveling in [destination]`** when the girls are on trips (e.g. Paris, Italy).
  - Identifies **Exchange Days** (e.g. Fridays with both parents) and detects drop-off vs. pick-up roles based on the prior day.
  - Highlights **No School / Recess** days (e.g. *Winter Recess*, *Midwinter Break*, *Spring Break*, *no school*) in red right below the date.
  - Lists daily events with start times and drop-off locations (e.g. *Avery pu @ 2:35* and *violin lesson*).
  - Clean day navigation stepper with **Today** badge.
  - On-demand minimalist **Date Picker** accessible via the top button to browse any day in the past or future.

- **Multi-Calendar Sync**:
  - Primary Family Calendar (`graceandronnyg@gmail.com`)
  - Avery Pick-up Calendar (renamed to `Avery pu @ [time]` with drop-off destination)
  - Gabby Penny Violin Lessons (renamed to `violin lesson`)

---

## Live Deployment on GitHub Pages 🌐

This project is deployed to GitHub Pages at:
**`https://graceqa.github.io/where-are-the-girls/`**

### Automatic Syncing via GitHub Actions:
A GitHub Actions workflow (`.github/workflows/deploy.yml`) handles building and publishing the site to GitHub Pages:
- **On every push to `main`**
- **Automatically every 6 hours** on a cron schedule
- **On demand**: Click **"Run workflow"** under the **Actions** tab in GitHub anytime to trigger an instant sync!

### Setting Up GitHub Secrets for Live Sync:
In your GitHub repository (**Settings ➔ Secrets and variables ➔ Actions ➔ New repository secret**):
1. **`GOOGLE_SERVICE_ACCOUNT_EMAIL`**:
   `calendar-reader@gabby-and-penny-schedule.iam.gserviceaccount.com`
2. **`GOOGLE_PRIVATE_KEY`**:
   *(Paste the private key from your service account JSON file, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines)*

### Enabling GitHub Pages in Repository Settings:
1. In your GitHub repo, go to **Settings ➔ Pages**.
2. Under **Build and deployment ➔ Source**, select **GitHub Actions**.

---

## Local Development

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Run in Development Mode
Starts both the Express API server (port 3001) and Vite React client (port 5173 with proxy):
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 3. Run Sync Script Manually
```bash
npm run sync
```

### 4. Run Unit Tests
```bash
npm test
```
