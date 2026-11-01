---
name: Firebase credential boundary
description: Safe separation between Firebase client configuration and Admin SDK credentials for the CropGuard app.
---

Firebase client configuration can be used in the Expo mobile bundle, but Firebase Admin SDK service-account JSON must never be bundled into the app or exposed to the client.

**Why:** Admin SDK files contain private signing credentials, while the client configuration is designed for browser/mobile SDK initialization and is protected by Firebase rules.

**How to apply:** Keep Firestore access behind Firebase security rules. Use client configuration only in the mobile app; if server-side Admin access is added later, move the credential into Replit Secrets and keep it in the API server.