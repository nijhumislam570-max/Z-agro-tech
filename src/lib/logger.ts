/**
 * Production-safe logger utility.
 * Silences console.error output in production to prevent
 * leaking internal details (table names, error codes, etc.)
 */

const isDev = import.meta.env.DEV;

export const logger = {
  error: (...args: unknown[]) => {
    if (isDev) {
      console.error(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info(...args);
    }
  },
};
