# Where Are The Girls? 👧🗓️

A shared custody & daily activity calendar web application designed for co-parents **Grace** and **Ronny**.

---

## Features

- **Default Current-Day Overview**:
  - Prominently displays which parent the girls are with today (*With Grace* or *With Ronny*).
  - Automatically identifies **Exchange Days** (e.g. typical Fridays with events for both Grace & Ronny).
  - Resolves the drop-off and pick-up roles based on who the girls resided with the day before:
    - *Example*: Ronny with girls on Thursday ➔ **Ronny drops off ➔ Grace picks up on Friday**.
    - *Example*: Grace with girls on Thursday ➔ **Grace drops off ➔ Ronny picks up on Friday**.
- **Interactive Calendar Widget**:
  - Full-month calendar view allowing you to browse any date in the past or future.
  - Color-coded custody tags:
    - 🌸 **Grace**: Warm Coral
    - 🌊 **Ronny**: Ocean Teal
    - 🔄 **Exchange Day**: Transition badge
  - Blue activity dots representing the number of commitments on each day.
  - **"Today" Shortcut Buttons**: Instant single-click jump back to the current day from anywhere in the app.
- **Daily Commitments & Activity Timeline**:
  - Separates custody markers from actual activities (school drop-off/pick-up, soccer, piano, dentist, recitals, parties).
  - Displays event time, location (with 📍 map icon), and description notes.
  - Friendly empty state when no activities are scheduled for that day.
- **Google Calendar API Integration & Zero-Config Demo Mode**:
  - Ready to use right out of the box with realistic sample data for Grace & Ronny.
  - Connect your live shared Google Calendar anytime using a Google Cloud Service Account.

---

## Quick Start

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

### 3. Production Build & Start
```bash
npm run build
npm start
```
Open **[http://localhost:3001](http://localhost:3001)** in your browser.

### 4. Running Unit Tests
```bash
npm test
```

---

## Connecting Your Live Google Calendar

1. **Create a Google Cloud Service Account**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Create a project and enable the **Google Calendar API**.
   - Create a Service Account (e.g., `where-are-the-girls@project.iam.gserviceaccount.com`).
   - Create and download a **JSON Key** for that Service Account.

2. **Share your Shared Calendar**:
   - Open [Google Calendar](https://calendar.google.com/).
   - Open **Settings and Sharing** for your shared custody calendar.
   - Under *Share with specific people*, add the Service Account email with **"See all event details"** permission.
   - Copy the **Calendar ID** (looks like `xyz@group.calendar.google.com` or your primary email).

3. **Configure `.env`**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your credentials:
   ```env
   PORT=3001
   GOOGLE_CALENDAR_ID="your-calendar-id@group.calendar.google.com"
   GOOGLE_SERVICE_ACCOUNT_EMAIL="where-are-the-girls@your-project.iam.gserviceaccount.com"
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk...-----END PRIVATE KEY-----\n"
   ```
   Restart the server. The status badge will change to **"Google Calendar Connected"**!
