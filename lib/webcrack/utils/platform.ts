export function isBrowser(): boolean {
  return typeof window !== 'undefined' || (typeof self !== 'undefined' && typeof self.importScripts === 'function');
}
