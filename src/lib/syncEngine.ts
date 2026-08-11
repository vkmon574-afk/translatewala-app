import { AppState, Project, Transaction } from '../types';

const LOCAL_STORAGE_KEY = 'translatewala_app_state_v1';
const PENDING_QUEUE_KEY = 'translatewala_pending_sync_queue';
const DEVICE_ID_KEY = 'translatewala_device_id';

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = 'dev-' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function loadLocalState(): AppState | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse local state:', e);
  }
  return null;
}

export function saveLocalState(state: AppState): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save local state:', e);
  }
}

export function getPendingQueue(): Array<{ type: string; payload: any; timestamp: string }> {
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function addToPendingQueue(item: { type: string; payload: any }): void {
  const queue = getPendingQueue();
  queue.push({ ...item, timestamp: new Date().toISOString() });
  localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
}

export function clearPendingQueue(): void {
  localStorage.removeItem(PENDING_QUEUE_KEY);
}
