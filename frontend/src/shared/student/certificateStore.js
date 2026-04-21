import { defaultCertificateRequests, STORAGE_CERTIFICATE_REQUESTS_KEY } from './studentData';

function sortByRequestedDateDesc(items) {
  return [...items].sort((left, right) => new Date(right.requestedAt).getTime() - new Date(left.requestedAt).getTime());
}

export function getCertificateRequests() {
  if (typeof window === 'undefined') {
    return sortByRequestedDateDesc(defaultCertificateRequests);
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_CERTIFICATE_REQUESTS_KEY);
    if (!rawValue) {
      return sortByRequestedDateDesc(defaultCertificateRequests);
    }

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return sortByRequestedDateDesc(defaultCertificateRequests);
    }

    return sortByRequestedDateDesc(parsed);
  } catch {
    return sortByRequestedDateDesc(defaultCertificateRequests);
  }
}

export function saveCertificateRequests(requests) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_CERTIFICATE_REQUESTS_KEY, JSON.stringify(sortByRequestedDateDesc(requests)));
}

export function upsertCertificateRequest(nextRequest) {
  const currentRequests = getCertificateRequests();
  const existingIndex = currentRequests.findIndex((item) => item.id === nextRequest.id);

  if (existingIndex >= 0) {
    const updated = [...currentRequests];
    updated[existingIndex] = {
      ...updated[existingIndex],
      ...nextRequest,
    };
    saveCertificateRequests(updated);
    return updated;
  }

  const appended = [nextRequest, ...currentRequests];
  saveCertificateRequests(appended);
  return appended;
}
