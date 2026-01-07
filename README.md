# Photo Illusions Website

Premium On-Site Digital Photography Studio website with AI-powered chat support.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set your Gemini API key in `.env.local`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

## Deploy to Render

### Option 1: Static Site (Recommended)

1. Push this repo to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **New** → **Static Site**
4. Connect your GitHub repo
5. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
6. Add Environment Variable:
   - Key: `GEMINI_API_KEY`
   - Value: Your Gemini API key
7. Click **Create Static Site**

### Option 2: Connect Existing Repo

If you already have a Render site:
1. Go to your site's **Settings**
2. Update Build Command to: `npm install && npm run build`
3. Update Publish Directory to: `dist`
4. Add `GEMINI_API_KEY` in **Environment** section
5. Trigger a manual deploy

## Project Structure

```
├── components/
│   ├── Navbar.tsx
│   ├── Hero.tsx
│   ├── Gallery.tsx
│   ├── Contact.tsx
│   ├── Footer.tsx
│   └── VoiceSupport.tsx
├── App.tsx
├── index.tsx
├── index.css
├── index.html
├── geminiService.ts
├── vite.config.ts
└── package.json
```

## Features

- On-Site Photo Booth services
- AI-powered chat support (Gemini)
- Responsive design
- Image gallery with Google Drive integration
- Contact form linking to registration
