const tokenPattern = /^[A-F0-9]{24}$/i;

export function newSubmissionId() {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("").toUpperCase();
}

export function getOrCreateSubmissionId(storageKey: string) {
  try {
    const existing = sessionStorage.getItem(storageKey);
    if (existing && tokenPattern.test(existing)) return existing.toUpperCase();
    const token = newSubmissionId();
    sessionStorage.setItem(storageKey, token);
    return token;
  } catch {
    // HTTPS browsers should provide Web Crypto. Fail closed rather than silently
    // downgrade the reference to a predictable Math.random() value.
    return newSubmissionId();
  }
}

export function readSavedReference(resultKey: string) {
  try {
    const reference = sessionStorage.getItem(resultKey) ?? "";
    return /^(DPH-REP|DPH-ORD)-[A-F0-9]{24}$/i.test(reference) ? reference.toUpperCase() : null;
  } catch {
    return null;
  }
}

export function saveReference(resultKey: string, reference: string) {
  try { sessionStorage.setItem(resultKey, reference); } catch { /* Private browsing can disable storage; the live component state still works. */ }
}

export function startNewSubmission(storageKey: string, resultKey: string) {
  const token = newSubmissionId();
  try {
    sessionStorage.setItem(storageKey, token);
    sessionStorage.removeItem(resultKey);
  } catch { /* The in-memory token remains valid for the current form session. */ }
  return token;
}
