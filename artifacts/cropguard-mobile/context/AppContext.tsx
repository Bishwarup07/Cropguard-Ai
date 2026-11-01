import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { cropsCollection, demoUserId, firestore, scansCollection } from '@/lib/firebase';

export type CropStatus = 'good' | 'monitor' | 'alert';
export type SyncStatus = 'syncing' | 'synced' | 'offline';

export interface Crop {
  id: string;
  name: string;
  field: string;
  acres: number;
  status: CropStatus;
  progress: number;
  stage: string;
}

export interface Scan {
  id: string;
  crop: string;
  finding: string;
  severity: 'Good' | 'Monitor' | 'Alert';
  location: string;
  createdAt: string;
  imageUri?: string;
  confidence?: number;
  treatment?: string;
}

interface AppState {
  crops: Crop[];
  scans: Scan[];
  syncStatus: SyncStatus;
  addCrop: (crop: Omit<Crop, 'id'>) => void;
  addScan: (scan: Omit<Scan, 'id' | 'createdAt'>) => void;
}

const STORAGE_KEY = '@cropguard/state';

const initialCrops: Crop[] = [
  { id: 'rice-north', name: 'Rice (Paddy)', field: 'North Field', acres: 50, status: 'good', progress: 72, stage: 'Vegetative stage · Day 48' },
  { id: 'wheat-east', name: 'Wheat', field: 'East Field', acres: 35, status: 'monitor', progress: 55, stage: 'Tillering stage · Day 32' },
  { id: 'cotton-south', name: 'Cotton', field: 'South Field', acres: 28, status: 'alert', progress: 40, stage: 'Sector 4 flagged for aphids' },
  { id: 'sugarcane-south', name: 'Sugarcane', field: 'South Field', acres: 15, status: 'good', progress: 85, stage: 'Maturity stage · Day 210' },
];

const initialScans: Scan[] = [
  { id: 'scan-1', crop: 'Cotton', finding: 'Possible aphid presence', severity: 'Alert', location: 'South Field · Sector 4', createdAt: 'Today, 08:42', confidence: 0.91, treatment: 'Inspect the underside of leaves and isolate affected plants.' },
  { id: 'scan-2', crop: 'Rice (Paddy)', finding: 'Strong vegetative growth', severity: 'Good', location: 'North Field', createdAt: 'Yesterday, 17:20', confidence: 0.96, treatment: 'Continue current irrigation and field monitoring.' },
];

const AppContext = createContext<AppState | null>(null);

function safeWrite<T extends { id: string }>(path: 'crops' | 'scans', value: T) {
  const collectionRef = path === 'crops' ? cropsCollection : scansCollection;
  return setDoc(doc(collectionRef, value.id), { ...value, userId: demoUserId });
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [crops, setCrops] = useState<Crop[]>(initialCrops);
  const [scans, setScans] = useState<Scan[]>(initialScans);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('syncing');
  const [hydrated, setHydrated] = useState(false);
  const localWrite = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          const parsed = JSON.parse(stored) as { crops?: Crop[]; scans?: Scan[] };
          if (Array.isArray(parsed.crops)) setCrops(parsed.crops);
          if (Array.isArray(parsed.scans)) setScans(parsed.scans);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        setHydrated(true);
      });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ crops, scans })).catch(() => undefined);
  }, [crops, scans, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    setSyncStatus('syncing');
    const stopCrops = onSnapshot(
      cropsCollection,
      (snapshot) => {
        if (!snapshot.empty && !localWrite.current) {
          setCrops(snapshot.docs.map((item) => item.data() as Crop));
        }
        setSyncStatus('synced');
      },
      () => setSyncStatus('offline'),
    );
    const stopScans = onSnapshot(
      scansCollection,
      (snapshot) => {
        if (!snapshot.empty && !localWrite.current) {
          setScans(snapshot.docs.map((item) => item.data() as Scan).sort((a, b) => b.id.localeCompare(a.id)));
        }
        setSyncStatus('synced');
      },
      () => setSyncStatus('offline'),
    );
    return () => {
      stopCrops();
      stopScans();
    };
  }, [hydrated]);

  const value = useMemo<AppState>(() => ({
    crops,
    scans,
    syncStatus,
    addCrop: (crop) => {
      const next = { ...crop, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
      setCrops((current) => [...current, next]);
      localWrite.current = true;
      safeWrite('crops', next).then(() => { localWrite.current = false; setSyncStatus('synced'); }).catch(() => { localWrite.current = false; setSyncStatus('offline'); });
    },
    addScan: (scan) => {
      const next = { ...scan, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: 'Just now' };
      setScans((current) => [next, ...current]);
      localWrite.current = true;
      safeWrite('scans', next).then(() => { localWrite.current = false; setSyncStatus('synced'); }).catch(() => { localWrite.current = false; setSyncStatus('offline'); });
    },
  }), [crops, scans, syncStatus]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}