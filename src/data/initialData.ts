import { VendorApplication, OutboxEmail, AdminUser } from '../types';

export const DEFAULT_ADMIN: AdminUser = {
  id: 'admin-mirfan',
  email: 'mirfan6874@gmail.com',
  name: 'Irfan (Lead Admin)',
  role: 'Super Admin',
  department: 'Media Prima Group HR & Event Ops',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Irfan',
  createdAt: '2025-05-01T08:00:00.000Z',
  lastLoginAt: new Date().toISOString(),
  isOnline: true,
};

export const INITIAL_ADMINS: AdminUser[] = [
  DEFAULT_ADMIN,
  {
    id: 'admin-farah',
    email: 'farah.yasmin@mediaprima.com.my',
    name: 'Farah Yasmin',
    role: 'Head of Group HR',
    department: 'Group Human Resources',
    avatar: '/src/assets/images/avatar_farah_yasmin_1790664312696.jpg',
    createdAt: '2025-05-01T08:00:00.000Z',
    lastLoginAt: '2025-05-12T09:30:00.000Z',
    isOnline: false,
  },
  {
    id: 'admin-kamal',
    email: 'kamal.ariff@mediaprima.com.my',
    name: 'Kamal Ariff',
    role: 'HR Reviewer & Safety Officer',
    department: 'Occupational Safety & Health (OSH)',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kamal',
    createdAt: '2025-05-02T08:00:00.000Z',
    lastLoginAt: '2025-05-11T16:20:00.000Z',
    isOnline: false,
  },
  {
    id: 'admin-default',
    email: 'admin@mediaprima.com.my',
    name: 'Media Prima Admin',
    role: 'HR Committee Admin',
    department: 'Group Human Resources & Employee Engagement',
    avatar: '/src/assets/images/avatar_farah_yasmin_1790664312696.jpg',
    createdAt: '2025-05-01T08:00:00.000Z',
    lastLoginAt: '2025-05-12T09:00:00.000Z',
    isOnline: false,
  },
];

export const INITIAL_APPLICATIONS: VendorApplication[] = [
  {
    id: 'app-001',
    referenceCode: 'MPB-HR-2025-001',
    applicantName: 'Ahmad Zulkifli bin Razak',
    businessName: 'Kopi Riong Enterprise',
    email: 'ahmad.zulkifli@kopiriong.my',
    phone: '+6012-3456789',
    vendorCategory: 'Company - Client',
    preferredMonth: 'July',
    salesItemType: 'Others',
    specifiedItemDescription: 'Event Photobooth Rental & Instant Print Services',
    tableCount: 1,
    chairQuantity: '2 Chairs (Recommended - Complimentary)',
    additionalNotes: 'Requires 13A electrical socket (plug point) for dye-sublimation photobooth printers.',
    isStaff: false,
    agreedToPdpa: true,
    submittedAt: '2025-05-12T09:42:00.000Z',
    status: 'Pending',
  },
  {
    id: 'app-002',
    referenceCode: 'MPB-HR-2025-002',
    applicantName: 'Siti Nurhaliza binti Kamaruddin',
    businessName: 'Dapur Sri Pentas Nasi Lemak Royale',
    email: 'siti.kamaruddin@dapursripentas.com',
    phone: '+6019-8765432',
    vendorCategory: 'HR - Vendor',
    preferredMonth: 'July',
    salesItemType: 'Food & Beverages (F&B)',
    specifiedItemDescription: 'Traditional Sambal Sotong Nasi Lemak & Hot Teh Tarik',
    tableCount: 1,
    chairQuantity: '2 Chairs (Recommended - Complimentary)',
    additionalNotes: 'Food warmer will be utilized. Complying with food safety and hygiene guidelines.',
    isStaff: true,
    staffId: 'MPB-8831',
    department: 'Digital Media Prima',
    agreedToPdpa: true,
    submittedAt: '2025-05-10T14:15:00.000Z',
    status: 'Approved',
    reviewedAt: '2025-05-11T10:30:00.000Z',
    reviewedBy: 'Farah Yasmin (Super Admin)',
  },
  {
    id: 'app-crew-001',
    referenceCode: 'MPB-CREW-2025-412-01',
    applicantName: 'Muhammad Danial bin Rosli',
    businessName: 'Kelab Media Prima - Staf Bazar Seloka',
    email: 'danial.rosli@mediaprima.com.my',
    phone: '+6017-3344556',
    vendorCategory: 'Kelab Media Prima Berhad',
    preferredMonth: 'Bazar Seloka (Official Event Crew)',
    salesItemType: 'Food & Beverages (F&B)',
    specifiedItemDescription: 'Nasi Lemak Daun Pisang & Minuman Sejuk',
    tableCount: 1,
    chairQuantity: 'Not Required',
    additionalNotes: 'Syif bertugas pagi bermula 8.30 pagi untuk persediaan makanan.',
    isStaff: true,
    staffId: 'MPB-9102',
    icNumber: '940315-10-5511',
    department: 'Media Prima Television Networks (TV3, 8TV, TV9)',
    groupBatchId: 'BATCH-MPB-CREW-412',
    crewIndex: 1,
    totalCrewInBatch: 2,
    agreedToPdpa: true,
    submittedAt: '2025-05-12T11:20:00.000Z',
    status: 'Pending',
  },
  {
    id: 'app-crew-002',
    referenceCode: 'MPB-CREW-2025-412-02',
    applicantName: 'Nur Ain binti Azman',
    businessName: 'Kelab Media Prima - Staf Bazar Seloka',
    email: 'nurain.azman@mediaprima.com.my',
    phone: '+6013-4455667',
    vendorCategory: 'Kelab Media Prima Berhad',
    preferredMonth: 'Bazar Seloka (Official Event Crew)',
    salesItemType: 'Food & Beverages (F&B)',
    specifiedItemDescription: 'Nasi Lemak Daun Pisang & Minuman Sejuk',
    tableCount: 1,
    chairQuantity: 'Not Required',
    additionalNotes: 'Syif petang bermula 12.00 tengah hari.',
    isStaff: true,
    staffId: 'MPB-9105',
    icNumber: '960722-14-6020',
    department: 'Media Prima Television Networks (TV3, 8TV, TV9)',
    groupBatchId: 'BATCH-MPB-CREW-412',
    crewIndex: 2,
    totalCrewInBatch: 2,
    agreedToPdpa: true,
    submittedAt: '2025-05-12T11:20:00.000Z',
    status: 'Pending',
  },
  {
    id: 'app-crew-003',
    referenceCode: 'MPB-CREW-2025-508',
    applicantName: 'Khairul Anuar bin Zainal',
    businessName: 'Rev Media Youth Operations Crew',
    email: 'khairul.anuar@revmedia.my',
    phone: '+6019-7788990',
    vendorCategory: 'Kelab Media Prima Berhad',
    preferredMonth: 'Bazar Seloka (Official Event Crew)',
    salesItemType: 'Services & Lifestyle',
    specifiedItemDescription: 'Event Photography & Social Media Livestreaming Booth',
    tableCount: 1,
    chairQuantity: 'Not Required',
    additionalNotes: 'Perlukan akses punca kuasa untuk pengecas kamera siaran.',
    isStaff: true,
    staffId: 'MPB-7742',
    icNumber: '920804-08-5931',
    department: 'Rev Media Group (Vocket, SAYS, Viralcham, Rojaklah)',
    agreedToPdpa: true,
    submittedAt: '2025-05-11T15:00:00.000Z',
    status: 'Approved',
    reviewedAt: '2025-05-12T09:10:00.000Z',
    reviewedBy: 'Irfan (Super Admin)',
  },
];

export const INITIAL_EMAILS: OutboxEmail[] = [
  {
    id: 'em-001',
    applicationId: 'app-002',
    referenceCode: 'MPB-HR-2025-002',
    recipientEmail: 'siti.kamaruddin@dapursripentas.com',
    recipientName: 'Siti Nurhaliza binti Kamaruddin',
    businessName: 'Dapur Sri Pentas Nasi Lemak Royale',
    subject: '[APPROVED] MPB HR Carnival 2025 Vendor Participation Confirmation (Ref: MPB-HR-2025-002)',
    type: 'Approval',
    sentAt: '2025-05-11T10:30:00.000Z',
    status: 'Simulated',
    htmlBody: `
Dear Siti Nurhaliza binti Kamaruddin,

Tahniah! We are pleased to inform you that your application for Dapur Sri Pentas Nasi Lemak Royale to operate as a vendor at the HR Carnival 2025 (July 2025) has been officially APPROVED by Media Prima Berhad Human Resources.

Application Summary:
• Reference Code: MPB-HR-2025-002
• Vendor: Siti Nurhaliza binti Kamaruddin
• Business Name: Dapur Sri Pentas Nasi Lemak Royale
• Category: Food & Beverages (F&B)
• Location: Balai Berita Grounds, Jalan Riong KL
• Allocated Space: 1 Standard Table (3' x 3') with 2 Chairs

Logistics & Ingress Briefing:
1. Vendor Ingress: Starts promptly at 07:30 AM on event day.
2. Unloading Bay: Entry via Gate 2, Balai Berita Bangsar.
3. Access Passes: 2 Crew Badges will be provided at the HR Registration Counter.

For any logistics inquiries or changes, please contact the HR Events Committee at hrevents@mediaprima.com.my.

Warm regards,
Farah Yasmin
Head of Human Resources & Employee Engagement
Media Prima Berhad
    `.trim(),
  },
];

const STORAGE_KEYS = {
  APPLICATIONS: 'mpb_vendor_applications_v1',
  OUTBOX: 'mpb_vendor_outbox_v1',
  AUTH: 'mpb_vendor_auth_v1',
  ADMINS: 'mpb_vendor_admins_v1',
};

export const getStoredAdmins = (): AdminUser[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMINS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(INITIAL_ADMINS));
      return INITIAL_ADMINS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read admins from localStorage', e);
    return INITIAL_ADMINS;
  }
};

export const saveStoredAdmins = (admins: AdminUser[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
  } catch (e) {
    console.error('Failed to write admins to localStorage', e);
  }
};

export const getStoredApplications = (): VendorApplication[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(INITIAL_APPLICATIONS));
      return INITIAL_APPLICATIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read applications from localStorage', e);
    return INITIAL_APPLICATIONS;
  }
};

export const saveStoredApplications = (apps: VendorApplication[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
  } catch (e) {
    console.error('Failed to write applications to localStorage', e);
  }
};

export const getStoredOutbox = (): OutboxEmail[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OUTBOX);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.OUTBOX, JSON.stringify(INITIAL_EMAILS));
      return INITIAL_EMAILS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read outbox from localStorage', e);
    return INITIAL_EMAILS;
  }
};

export const saveStoredOutbox = (emails: OutboxEmail[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.OUTBOX, JSON.stringify(emails));
  } catch (e) {
    console.error('Failed to write outbox to localStorage', e);
  }
};

export const getStoredAuth = (): AdminUser | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

export const setStoredAuth = (user: AdminUser | null): void => {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    }
  } catch (e) {
    console.error('Failed to update auth in localStorage', e);
  }
};
