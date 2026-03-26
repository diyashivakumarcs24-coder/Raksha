# ShadowwSOS — Deployment Guide

## 🚀 Deploy to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/shadowwsos.git
git push -u origin main
```

### 2. Import to Vercel
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Framework: **Next.js** (auto-detected)
4. Click **Deploy**

### 3. Add Firebase Environment Variables
In Vercel → Project Settings → Environment Variables, add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | From Firebase Console |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `your-project-id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | From Firebase Console |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | From Firebase Console |

---

## 🔥 Firebase Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Add a **Web App** → copy the config values above
4. Enable **Firestore Database** (Start in test mode)
5. Enable **Storage** (Start in test mode)

### Firestore Rules (for production):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /alerts/{alertId} {
      allow read, write: if true; // Tighten for production
    }
  }
}
```

---

## 🧮 App Entry Points

| URL | Description |
|---|---|
| `/` | Disguised Calculator (default) |
| `/dashboard` | Main safety dashboard |
| `/fake-call` | Fake incoming call screen |

### Unlock Calculator:
- Type PIN **`1947`** anywhere in the calculator
- OR long-press the `=` button for 1.5 seconds

---

## 💻 Local Development

```bash
npm install
# Edit .env.local with your Firebase config
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)
