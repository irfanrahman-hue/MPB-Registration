import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { VendorApplication, OutboxEmail, VendorStatus, AdminUser } from '../types';
import {
  INITIAL_APPLICATIONS,
  INITIAL_EMAILS,
  INITIAL_ADMINS,
  getStoredApplications,
  saveStoredApplications,
  getStoredOutbox,
  saveStoredOutbox,
  getStoredAdmins,
  saveStoredAdmins,
} from '../data/initialData';

const APPLICATIONS_COLLECTION = 'vendor_applications';
const OUTBOX_COLLECTION = 'outbox_emails';
const ADMINS_COLLECTION = 'admins';

// Helper to remove any undefined fields before sending to Firestore
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const copy: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      copy[key] = value;
    }
  }
  return copy;
}

// -------------------------------------------------------------
// Real-time listener for Vendor Applications
// -------------------------------------------------------------
export function subscribeToApplications(
  onUpdate: (apps: VendorApplication[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const colRef = collection(db, APPLICATIONS_COLLECTION);

    const unsubscribe = onSnapshot(
      colRef,
      async (snapshot) => {
        if (snapshot.empty) {
          // If Firestore collection is empty, seed with initial applications
          const initial = getStoredApplications();
          try {
            await Promise.all(
              initial.map((app) =>
                setDoc(
                  doc(db, APPLICATIONS_COLLECTION, app.id),
                  sanitizeForFirestore(app)
                )
              )
            );
          } catch (seedErr) {
            console.warn('Seeding initial data to Firestore had an issue:', seedErr);
          }
          onUpdate(initial);
          return;
        }

        const items: VendorApplication[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as VendorApplication);
        });

        // Sort by submittedAt descending (newest first)
        items.sort(
          (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );

        saveStoredApplications(items);
        onUpdate(items);
      },
      (error) => {
        console.warn('Firestore onSnapshot error, falling back to local cache:', error);
        if (onError) onError(error);
        onUpdate(getStoredApplications());
        try {
          handleFirestoreError(error, OperationType.GET, APPLICATIONS_COLLECTION);
        } catch {
          // Suppress after logging
        }
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Failed to initialize Firestore applications subscription:', err);
    onUpdate(getStoredApplications());
    return () => {};
  }
}

// Add or update application in Firestore
export async function saveApplicationToFirestore(
  app: VendorApplication
): Promise<void> {
  const sanitized = sanitizeForFirestore(app);
  try {
    const docRef = doc(db, APPLICATIONS_COLLECTION, app.id);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err) {
    console.warn('Could not save to Firestore directly, updating local cache:', err);
    try {
      handleFirestoreError(err, OperationType.WRITE, `${APPLICATIONS_COLLECTION}/${app.id}`);
    } catch {
      // Suppress after logging
    }
  } finally {
    // Always keep localStorage updated
    const current = getStoredApplications();
    const existingIndex = current.findIndex((a) => a.id === app.id);
    if (existingIndex >= 0) {
      current[existingIndex] = app;
    } else {
      current.unshift(app);
    }
    saveStoredApplications(current);
  }
}

// Update application review status in Firestore
export async function updateApplicationStatusInFirestore(
  id: string,
  newStatus: VendorStatus,
  reviewerName: string,
  rejectionReason?: string
): Promise<void> {
  const updatePayload: Partial<VendorApplication> = {
    status: newStatus,
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewerName,
    ...(rejectionReason ? { rejectionReason } : {}),
  };

  try {
    const docRef = doc(db, APPLICATIONS_COLLECTION, id);
    await updateDoc(docRef, updatePayload);
  } catch (err) {
    console.warn('Firestore status update failed, saving locally:', err);
    try {
      handleFirestoreError(err, OperationType.UPDATE, `${APPLICATIONS_COLLECTION}/${id}`);
    } catch {
      // Suppress after logging
    }
  } finally {
    const current = getStoredApplications();
    const updated = current.map((app) =>
      app.id === id ? { ...app, ...updatePayload } : app
    );
    saveStoredApplications(updated);
  }
}

// -------------------------------------------------------------
// Real-time listener for Outbox Emails
// -------------------------------------------------------------
export function subscribeToOutbox(
  onUpdate: (emails: OutboxEmail[]) => void
): () => void {
  try {
    const colRef = collection(db, OUTBOX_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      async (snapshot) => {
        if (snapshot.empty) {
          const initial = getStoredOutbox();
          try {
            await Promise.all(
              initial.map((em) =>
                setDoc(doc(db, OUTBOX_COLLECTION, em.id), sanitizeForFirestore(em))
              )
            );
          } catch (seedErr) {
            console.warn('Seeding initial outbox had an issue:', seedErr);
          }
          onUpdate(initial);
          return;
        }

        const items: OutboxEmail[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as OutboxEmail);
        });

        items.sort(
          (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
        );

        saveStoredOutbox(items);
        onUpdate(items);
      },
      (error) => {
        console.warn('Firestore outbox snapshot error, using local cache:', error);
        onUpdate(getStoredOutbox());
        try {
          handleFirestoreError(error, OperationType.GET, OUTBOX_COLLECTION);
        } catch {
          // Suppress after logging
        }
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Failed to initialize Firestore outbox subscription:', err);
    onUpdate(getStoredOutbox());
    return () => {};
  }
}

// Save outbox email to Firestore
export async function saveOutboxEmailToFirestore(
  email: OutboxEmail
): Promise<void> {
  const sanitized = sanitizeForFirestore(email);
  try {
    const docRef = doc(db, OUTBOX_COLLECTION, email.id);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err) {
    console.warn('Firestore outbox write error:', err);
    try {
      handleFirestoreError(err, OperationType.WRITE, `${OUTBOX_COLLECTION}/${email.id}`);
    } catch {
      // Suppress after logging
    }
  } finally {
    const current = getStoredOutbox();
    current.unshift(email);
    saveStoredOutbox(current);
  }
}

// -------------------------------------------------------------
// Real-time listener & operations for Admin Users
// -------------------------------------------------------------
export function subscribeToAdmins(
  onUpdate: (admins: AdminUser[]) => void
): () => void {
  try {
    const colRef = collection(db, ADMINS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      async (snapshot) => {
        if (snapshot.empty) {
          // If empty, auto-seed with initial admins
          const initial = getStoredAdmins();
          try {
            await Promise.all(
              initial.map((admin) => {
                const adminId = admin.id || `admin-${admin.email.replace(/[@.]/g, '_')}`;
                return setDoc(
                  doc(db, ADMINS_COLLECTION, adminId),
                  sanitizeForFirestore({ ...admin, id: adminId })
                );
              })
            );
          } catch (seedErr) {
            console.warn('Seeding initial admins to Firestore:', seedErr);
          }
          onUpdate(initial);
          return;
        }

        const items: AdminUser[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as AdminUser);
        });

        // Sort by role hierarchy (Super Admin first) then name
        items.sort((a, b) => {
          if (a.role === 'Super Admin') return -1;
          if (b.role === 'Super Admin') return 1;
          return a.name.localeCompare(b.name);
        });

        saveStoredAdmins(items);
        onUpdate(items);
      },
      (error) => {
        console.warn('Firestore admins subscription error, falling back to cache:', error);
        onUpdate(getStoredAdmins());
        try {
          handleFirestoreError(error, OperationType.GET, ADMINS_COLLECTION);
        } catch {
          // Suppress after logging
        }
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Failed to initialize Firestore admins subscription:', err);
    onUpdate(getStoredAdmins());
    return () => {};
  }
}

// Save or update admin in Firestore
export async function saveAdminToFirestore(admin: AdminUser): Promise<void> {
  const adminId = admin.id || `admin-${admin.email.replace(/[@.]/g, '_')}`;
  const sanitized = sanitizeForFirestore({ ...admin, id: adminId });
  try {
    const docRef = doc(db, ADMINS_COLLECTION, adminId);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err) {
    console.warn('Could not save admin to Firestore:', err);
    try {
      handleFirestoreError(err, OperationType.WRITE, `${ADMINS_COLLECTION}/${adminId}`);
    } catch {
      // Suppress after logging
    }
  } finally {
    const current = getStoredAdmins();
    const existingIndex = current.findIndex((a) => a.email.toLowerCase() === admin.email.toLowerCase());
    if (existingIndex >= 0) {
      current[existingIndex] = { ...current[existingIndex], ...admin, id: adminId };
    } else {
      current.push({ ...admin, id: adminId });
    }
    saveStoredAdmins(current);
  }
}

// Delete or revoke admin from Firestore
export async function deleteAdminFromFirestore(adminId: string): Promise<void> {
  try {
    const docRef = doc(db, ADMINS_COLLECTION, adminId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Could not delete admin from Firestore:', err);
    try {
      handleFirestoreError(err, OperationType.DELETE, `${ADMINS_COLLECTION}/${adminId}`);
    } catch {
      // Suppress after logging
    }
  } finally {
    const current = getStoredAdmins();
    const filtered = current.filter((a) => a.id !== adminId);
    saveStoredAdmins(filtered);
  }
}
