// Samsung Tizen OS TVInputDevice hardware key registration & keyCode constants

export const TIZEN_KEYS = {
  ENTER: 13,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  PLAY: 415,
  PAUSE: 19,
  STOP: 413,
  REWIND: 412,
  FAST_FORWARD: 417,
  CHANNEL_UP: 427,
  CHANNEL_DOWN: 428,
  INFO: 457,
  COLOR_RED: 403,
  COLOR_GREEN: 404,
  COLOR_YELLOW: 405,
  COLOR_BLUE: 406,
  BACK: 10009,
  EXIT: 10182,
  PLAY_PAUSE: 10252,
  VOLUME_UP: 447,
  VOLUME_DOWN: 448,
  VOLUME_MUTE: 449,
} as const;

const KEYS_TO_REGISTER = [
  'Back',
  'ChannelUp',
  'ChannelDown',
  'MediaPlayPause',
  'MediaPlay',
  'MediaPause',
  'MediaStop',
  'Info',
  'ColorF0Red',
  'ColorF1Green',
  'ColorF2Yellow',
  'ColorF3Blue',
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
];

interface TizenTVInputDevice {
  registerKey?: (keyName: string) => void;
  unregisterKey?: (keyName: string) => void;
  registerKeyBatch?: (
    keys: string[],
    onSuccess?: () => void,
    onError?: (err: unknown) => void,
  ) => void;
  unregisterKeyBatch?: (
    keys: string[],
    onSuccess?: () => void,
    onError?: (err: unknown) => void,
  ) => void;
}

interface TizenGlobal {
  tvinputdevice?: TizenTVInputDevice;
  application?: {
    getCurrentApplication?: () => { exit?: () => void };
  };
}

declare global {
  interface Window {
    tizen?: TizenGlobal;
  }
}

export function isTizenEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.tizen?.tvinputdevice) || /Tizen/i.test(navigator.userAgent);
}

export function registerTizenRemoteKeys(): () => void {
  if (typeof window === 'undefined' || !window.tizen?.tvinputdevice) {
    return () => {};
  }

  const tvInput = window.tizen.tvinputdevice;

  try {
    if (typeof tvInput.registerKeyBatch === 'function') {
      tvInput.registerKeyBatch(KEYS_TO_REGISTER);
    } else if (typeof tvInput.registerKey === 'function') {
      KEYS_TO_REGISTER.forEach((key) => {
        try {
          tvInput.registerKey?.(key);
        } catch {
          // Ignore unsupported individual key on older firmware
        }
      });
    }
  } catch {
    // Safe fallback when not running inside Tizen WebView
  }

  return () => {
    try {
      if (typeof tvInput.unregisterKeyBatch === 'function') {
        tvInput.unregisterKeyBatch(KEYS_TO_REGISTER);
      } else if (typeof tvInput.unregisterKey === 'function') {
        KEYS_TO_REGISTER.forEach((key) => {
          try {
            tvInput.unregisterKey?.(key);
          } catch {
            // ignore
          }
        });
      }
    } catch {
      // ignore
    }
  };
}

export function exitTizenAppIfSupported(): void {
  try {
    window.tizen?.application?.getCurrentApplication?.().exit?.();
  } catch {
    // ignore outside Tizen OS
  }
}
