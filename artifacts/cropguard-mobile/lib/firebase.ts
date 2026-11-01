import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { collection, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCEZq3Wv7kVBZhId-sWNLvFyr7gdk966fIY',
  authDomain: 'cropguard-ai-4ec96.firebaseapp.com',
  projectId: 'cropguard-ai-4ec96',
  storageBucket: 'cropguard-ai-4ec96.firebasestorage.app',
  messagingSenderId: '647741006191',
  appId: '1:647741006191:web:d02be4b8ab73fde826089a',
  measurementId: 'G-68NN5HNF5R',
};

export const firebaseApp: FirebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);
export const firestore = getFirestore(firebaseApp);

export const demoUserId = 'demo-farmer';
export const cropsCollection = collection(firestore, 'users', demoUserId, 'crops');
export const scansCollection = collection(firestore, 'users', demoUserId, 'scans');