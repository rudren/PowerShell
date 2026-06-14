# Masai United FC — Player Management App

## Setup Guide

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- Firebase account

---

## Step 1: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project: **masai-united-fc**
3. Enable **Authentication** → Email/Password
4. Enable **Firestore Database** (Start in production mode)
5. Enable **Storage**
6. Copy your Firebase config

### Update Firebase Config
Edit `src/services/firebase.js`:
```js
const firebaseConfig = {
  apiKey: 'YOUR_ACTUAL_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};
```

### Deploy Firestore Security Rules
```bash
firebase deploy --only firestore:rules
```

---

## Step 2: Create First Admin Account

In Firebase Console → Authentication, create a user manually.
Then in Firestore, add a document to `users` collection:

```json
{
  "email": "admin@masaiunitedfc.com",
  "name": "Super Admin",
  "role": "admin",
  "phone": "+60XX-XXXXXXX",
  "isActive": true,
  "notificationEnabled": true,
  "createdAt": "<timestamp>"
}
```

---

## Step 3: Install & Run

```bash
cd MasaiUnitedFC
npm install
npx expo start
```

Scan QR code with **Expo Go** app on your phone.

---

## Step 4: Build APK

### Configure EAS
```bash
eas login
eas build:configure
```

Update `eas.json` with your EAS Project ID.

### Build APK (for testing)
```bash
npm run build:apk
```

### Build for Play Store
```bash
npm run build:android
```

---

## App Structure

```
MasaiUnitedFC/
├── App.js                    # Entry point
├── app.json                  # Expo config
├── eas.json                  # EAS Build config
├── firestore.rules           # Security rules
├── src/
│   ├── navigation/           # Role-based navigation
│   ├── screens/
│   │   ├── auth/             # Login, Forgot Password
│   │   ├── admin/            # Admin screens
│   │   ├── coach/            # Coach screens
│   │   └── parent/           # Parent screens
│   ├── services/             # Firebase services
│   ├── context/              # Auth context
│   ├── components/           # Shared components
│   └── utils/                # Theme, constants, helpers
```

---

## Features

### Admin
- Dashboard with live stats
- Player management (Add/Edit/Deactivate)
- Session & attendance management
- Payment management & invoicing
- Record payments with receipt generation
- WhatsApp payment reminders (auto-open)
- WhatsApp payment confirmations
- Broadcast messages to parents
- Reports & analytics
- User management (Coaches & Parents)
- Parent view control (toggle what parents see)

### Coach
- Dashboard with assigned categories
- Take attendance for sessions
- Player progress notes (skill, fitness, discipline, etc.)
- View club broadcasts

### Parent
- Dashboard with child overview
- Attendance tracking with monthly view
- Payment history & invoices
- Download/Share invoice as PDF
- WhatsApp enquiry
- Club updates/broadcasts

---

## WhatsApp Integration

The app uses native WhatsApp deep links. When you tap "Send Reminder" or "Send Confirmation":
1. WhatsApp opens automatically
2. The message is pre-filled
3. You just tap Send

For bulk broadcasts, each parent gets a separate WhatsApp window opened sequentially.

---

## Play Store Submission

1. Build production AAB: `npm run build:android`
2. Download from EAS Build dashboard
3. Upload to Google Play Console
4. Fill in store listing details
5. Submit for review

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | React Native + Expo |
| Backend | Firebase (Firestore, Auth, Storage) |
| Navigation | React Navigation v6 |
| UI | React Native Paper + Custom |
| Notifications | Expo Notifications |
| PDF | Expo Print + Sharing |
| WhatsApp | Native deep links |
| Build | EAS Build (Expo) |

---

## Club Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Red | `#C41E3A` | Headers, buttons |
| Gold | `#FFD700` | Accents, logo |
| Dark Navy | `#1A1A2E` | Text |
| Success | `#28A745` | Paid, present |
| Danger | `#DC3545` | Unpaid, absent |

---

*Masai United FC © 2007 — Together We Rise ⚽*
