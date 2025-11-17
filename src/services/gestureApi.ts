import {Platform} from 'react-native';

export type GestureLabel = 'rock' | 'paper' | 'scissors';

export interface GesturePrediction {
  gesture: GestureLabel;
  confidence: number;
  raw: unknown;
}

const API_BASE_URL = 'https://rps-gesture-2.onrender.com';
const PREDICT_PATH = '/predict';
const VALID_GESTURES: GestureLabel[] = ['rock', 'paper', 'scissors'];

function normalizeUri(uri: string): string {
  if (!uri) {
    return uri;
  }

  if (uri.startsWith('content://')) {
    return uri;
  }

  if (uri.startsWith('file://')) {
    return uri;
  }

  if (Platform.OS === 'android') {
    return `file://${uri}`;
  }

  return uri;
}

function normalizeGestureLabel(value: unknown): GestureLabel | null {
  if (typeof value !== 'string') {
    return null;
  }

  const lowered = value.toLowerCase() as GestureLabel;
  return VALID_GESTURES.includes(lowered) ? lowered : null;
}

function resolveConfidence(payload: any): number | null {
  if (payload == null || typeof payload !== 'object') {
    return null;
  }

  if (typeof payload.confidence === 'number') {
    return payload.confidence;
  }

  if (typeof payload.score === 'number') {
    return payload.score;
  }

  if (typeof payload.probability === 'number') {
    return payload.probability;
  }

  if (payload.probabilities && typeof payload.probabilities === 'object') {
    const values = Object.values(payload.probabilities)
      .map(Number)
      .filter(value => !Number.isNaN(value));
    if (values.length) {
      return Math.max(...values);
    }
  }

  return null;
}

function normalizePrediction(payload: any): GesturePrediction | null {
  const gesture =
    normalizeGestureLabel(payload?.gesture) ??
    normalizeGestureLabel(payload?.label) ??
    normalizeGestureLabel(payload?.class_name) ??
    normalizeGestureLabel(payload?.prediction) ??
    normalizeGestureLabel(payload?.result);

  if (!gesture) {
    return null;
  }

  const confidence = resolveConfidence(payload) ?? 0;

  return {
    gesture,
    confidence,
    raw: payload,
  };
}

const API_TIMEOUT_MS = 60000; // 60 seconds for prediction requests
const API_WARMUP_TIMEOUT_MS = 10000; // 10 seconds for warmup ping

// Fetch with timeout helper
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(
        `Request timeout after ${
          timeoutMs / 1000
        }s. The API may be cold-starting. Please try again.`,
      );
    }
    throw error;
  }
}


export async function warmupApi(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(
      API_BASE_URL,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      },
      API_WARMUP_TIMEOUT_MS,
    );
    return response.ok;
  } catch (error) {
    console.warn('API warmup failed (non-fatal):', error);
    return false;
  }
}

export async function predictGestureFromApi(
  imageUri: string,
  options?: {
    fileName?: string;
    mimeType?: string;
  },
): Promise<GesturePrediction | null> {
  if (!imageUri) {
    return null;
  }

  const formData = new FormData();
  formData.append('file', {
    uri: normalizeUri(imageUri),
    name: options?.fileName ?? `gesture-${Date.now()}.jpg`,
    type: options?.mimeType ?? 'image/jpeg',
  } as any);

  const response = await fetchWithTimeout(
    `${API_BASE_URL}${PREDICT_PATH}`,
    {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
      },
    },
    API_TIMEOUT_MS,
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Prediction API responded with ${response.status}: ${message}`,
    );
  }

  const data = await response.json();
  return normalizePrediction(data);
}
