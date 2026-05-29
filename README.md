# 🌱 Smart Plant Watering System - Web App

A React web frontend for the Smart Plant Watering System. This application provides a dashboard to monitor plant moisture, view plant details, and connect to backend APIs for live data.

## Overview

This web app is designed for desktop and tablet use. It includes:
- Plant moisture dashboards
- Status cards for plant health
- Search and filter plant views
- Responsive layout for multiple screen sizes
- Backend API support via environment variables

## Features

- Dashboard summary with total plants, healthy plants, and moisture statistics
- Plant list with clear status indicators
- Visual moisture presentation and health labels
- Manual water controls (via backend commands)
- Support for backend configuration with `REACT_APP_API_URL`

## Requirements

- Node.js 14 or higher
- npm or yarn

## Installation

1. Open a terminal in the web app folder:
   ```bash
   cd e:\Download\appdev\Smart-Plant-Watering-System
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running Locally

Start the development server:
```bash
npm start
```

Open the app in your browser at:
```
http://localhost:3000
```

## Build for Production

Create an optimized build:
```bash
npm run build
```

The production files will be generated in the `build` folder.

## Backend Configuration

To connect the web app with a backend API, configure the base URL in a `.env.development` file:

```env
REACT_APP_API_URL=http://192.168.1.10:8001
```

If the backend is running on another device, update the IP address accordingly.

### Optional Backend URL Auto-Detect

When others clone the repo, they should create their own `.env.development` or `.env.local` file and set the backend URL for their device. For example:

```env
REACT_APP_API_URL=http://<YOUR_LOCAL_IP>:8001
```

- Use the backend host machine's LAN IP for phones or other devices on the same network.
- If the frontend and backend run on the same machine, `http://localhost:8001` can work in the browser.
- Restart the React server after changing `.env` files.

## Project Structure

```
Smart-Plant-Watering-System/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   ├── App.js
│   └── index.js
├── package.json
└── README.md
```

## Useful Commands

```bash
npm install
npm start
npm run build
npm test
npm run eject
```

## Deployment

### Deploy to Vercel

1. Push the project to GitHub.
2. Create a new Vercel project and connect your repository.
3. Use these settings:
   - Build Command: `npm run build`
   - Output Directory: `build`
4. Add environment variables in Vercel if needed.

### Other Hosting Options

- Use the `build` directory as static assets
- Host using any static file server such as Netlify, GitHub Pages, or Nginx

## Troubleshooting

### App does not start
- Run `npm install`
- Check for errors in the terminal
- Clear caches by deleting `node_modules` and reinstalling

### Backend connection fails
- Confirm `REACT_APP_API_URL` is correct
- Use the backend machine’s LAN IP when accessing from another device
- Restart the app after changing `.env`

### Build issues
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

## Notes

- This frontend is prepared for backend API integration.
- If you need live plant data, connect it to the FastAPI or Django backend.

## Support

For troubleshooting, refer to the backend README and the main repository documentation.

---

Built with React and designed for clean plant monitoring.
