import { v4 as uuidv4 } from 'uuid';

export interface BodyLogEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  weight: number;
  bodyFat: number;
  muscleMass: number;
}

const STORAGE_KEY = 'bodylog_entries';

export const getEntries = (): BodyLogEntry[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    const entries: BodyLogEntry[] = JSON.parse(data);
    // Sort by date descending (newest first)
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (e) {
    console.error('Failed to parse entries from localStorage', e);
    return [];
  }
};

export const addEntry = (entry: Omit<BodyLogEntry, 'id'>): BodyLogEntry[] => {
  const newEntry: BodyLogEntry = { ...entry, id: uuidv4() };
  const entries = getEntries();
  
  // Check if entry for this date already exists, if so update it instead of adding duplicate
  const existingIndex = entries.findIndex(e => e.date === entry.date);
  if (existingIndex >= 0) {
    entries[existingIndex] = { ...newEntry, id: entries[existingIndex].id }; // keep old id, update values
  } else {
    entries.push(newEntry);
  }
  
  // Sort again before saving
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return entries;
};

export const deleteEntry = (id: string): BodyLogEntry[] => {
  const entries = getEntries();
  const updatedEntries = entries.filter((entry) => entry.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
  return updatedEntries;
};
