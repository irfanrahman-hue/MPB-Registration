# Bazar Seloka Vendor & Crew Management Portal
> **Media Prima Berhad • Powered by Group Human Resources**

An enterprise-grade vendor registration, staff & crew management, and administrative approval system designed for **Bazar Seloka**, hosted at Media Prima Berhad headquarters in Balai Berita, Bangsar, Kuala Lumpur.

---

## 🌐 Live Application Link

- **AI Studio App URL:** [https://ai.studio/apps/e0d4423f-87ae-4468-8da5-899ccd1b597c](https://ai.studio/apps/e0d4423f-87ae-4468-8da5-899ccd1b597c)

---

## 📌 Event Details

- **Event Name:** Bazar Seloka 2025
- **Organizer:** Media Prima Berhad (Group Human Resources)
- **Location:** Balai Berita, Anjung Riong, 31, Jalan Riong, Bangsar, 59100 Kuala Lumpur, Malaysia
- **Operating Hours:** 10.00 am – 3.00 pm
- **Ingress Gate:** Pintu 2, Balai Berita Jalan Riong (Ingress starts strictly at 08:30 AM)

---

## 🚀 Key Features

### 1. Multi-Step Vendor Registration Form
- **Step 1: Applicant & Business Information**
  - Full Name, IC Number (MyKad), Business/Brand Name, Email, and Phone.
  - **4 Official Vendor Categories:**
    1. `Company - Client`
    2. `HR - Vendor`
    3. `Kelab Media Prima Berhad`
    4. `Fama`
- **Step 2: Schedule & Product Offering**
  - Preferred carnival month selection.
  - Sales category selection (*Food & Beverages (F&B)*, *Apparel & Fashion*, *Crafts & Accessories*, *Services & Lifestyle*, *Others*).
  - Detailed product/service description.
- **Step 3: Logistics & Legal Compliance**
  - Standard table allocation (1 Standard Unit: 3' x 3').
  - Complimentary chair allocation options (2, 4, or 6 chairs free of charge).
  - Special requirements (e.g., 13A electrical socket point requests).
  - Personal Data Protection Act (PDPA 2010) compliance agreement.

### 2. Multi-Crew & Staff Registration (Maksimum 6 Orang)
- **Shared Booth & Assignment Information**:
  - Teams share common details: Booth/Project Name, Media Prima Entity/Department (TV3, NSTP, Rev Media, Big Tree, Audio, Group HR), Sales/Duty Category, and Shift Notes.
  - Logistics streamlined without extra chair requirements for internal crew.
- **Individual Crew Member Cards (Up to 6 Persons)**:
  - Add up to 6 crew members with dedicated inputs for Full Name, IC Number / Staff ID, Corporate Email, and Phone Number.
- **Simultaneous Firebase Sync**:
  - All registered crew members are saved simultaneously into Google Cloud Firestore (`vendor_applications`).
  - Unique reference codes generated for each member (e.g., `MPB-CREW-2025-XXX-01`, `MPB-CREW-2025-XXX-02`).
  - Success modal with 1-click code copying.

### 3. Dedicated Crew Management Console on Dashboard
- **Top Navigation Switcher**:
  - `🏬 Permohonan Vendor & Peniaga`: General vendor applications.
  - `👥 Pendaftaran Staf & Kru MPB`: Dedicated console for internal staff & event crew.
- **Crew KPI Metrics Cards**:
  - Total Crew Individuals, Total Booth Teams/Batches, Pending HR Review, Approved Crew.
- **Dual Display Modes**:
  - **🏢 Grouped View (Tinjauan Pasukan / Gerai)**: Displays crew grouped by shared booth/batch with 1-click **Batch Approve** for all team members.
  - **📋 Roster Table View (Senarai Individu Kru)**: Searchable roster by Name, IC/Staff ID, Phone, or Reference Code, with quick entity filters (TV3, NSTP, Rev Media, Big Tree, Audio, Group HR).
- **Official Printable Event Crew Pass**:
  - Printable accreditation badge with Media Prima lanyard styling, crew name, IC, department, booth assignment, reference barcode, and Gate 2 ingress clearance.

### 4. HR Admin Approval Center & Access Control
- **Super Admin Authority & Officer Deletion**:
  - Only **Super Admin** accounts (e.g., `mirfan6874@gmail.com` and `farah.yasmin@mediaprima.com.my`) have the authority to remove or delete other admin accounts.
  - Confirmation modal and direct synchronization with Firebase Firestore `/admins` collection.
  - Regular officers have read-only access with locked badges.
- **Review & Decision Engine**:
  - 1-click Approval or Rejection with customizable rejection reasons.
  - Reset to Pending capability.
  - Filter by Vendor Category, Status, Month, and Staff/Crew toggle.
- **Data Export**:
  - Export full vendor applications to CSV.
  - Export dedicated crew roster to CSV.

### 5. Application Status Tracker
- Public inquiry portal allowing applicants and crew members to verify their approval status using their **Reference Code** (e.g., `MPB-HR-2025-001` or `MPB-CREW-2025-412-01`) or **IC Number**.
- Real-time status display: `Pending Review`, `Approved`, or `Rejected` with administrative remarks.

### 6. Outbox & Automated Notification Simulator
- Automatically generates official branded email confirmations upon HR decision.
- Includes booth ingress briefings, Gate 2 clearance guidelines, and logistics instructions.

---

## 🛠️ Technology Stack

- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Tooling:** [Vite](https://vite.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Backend & Real-time Database:** [Google Cloud Firestore / Firebase SDK](https://firebase.google.com/) with offline fallback caching and real-time listeners

---

## 📦 Getting Started

### Prerequisites
- Node.js (version 18 or above recommended)
- npm or yarn

### Installation & Local Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/bazar-seloka-portal.git
   cd bazar-seloka-portal
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Linting and Type Checks:**
   ```bash
   npm run lint
   ```

---

## 📂 Project Structure

```text
├── src/
│   ├── assets/               # Brand assets & avatar images
│   ├── components/           # Modular UI components
│   │   ├── AdminLogin.tsx            # Secure role-based admin authentication
│   │   ├── ApprovalCenter.tsx        # HR Admin approval center & crew console
│   │   ├── CrewStaffRegistration.tsx # Multi-crew registration form (up to 6)
│   │   ├── Header.tsx                # Corporate header & navigation bar
│   │   ├── MediaPrimaLogo.tsx        # Official Media Prima SVG branding
│   │   ├── OutboxModal.tsx           # Simulated email outbox viewer
│   │   ├── StatusTracker.tsx         # Reference code & IC tracker
│   │   └── VendorRegistrationForm.tsx# Multi-step vendor registration form
│   ├── data/
│   │   └── initialData.ts            # Seed data & localStorage persistence
│   ├── services/
│   │   ├── firebaseConfig.ts         # Firebase SDK initialization
│   │   └── firebaseService.ts        # Firestore persistence & real-time sync
│   ├── types/
│   │   └── index.ts                  # TypeScript definitions & schemas
│   ├── App.tsx                       # Main application state container
│   ├── index.css                     # Global Tailwind CSS directives
│   └── main.tsx                      # Vite React entry point
├── public/                           # Static assets
├── firestore.rules                   # Firestore security rules
├── metadata.json                     # AI Studio metadata
├── package.json                      # Project dependencies & scripts
├── tsconfig.json                     # TypeScript configuration
└── README.md                         # Project documentation
```

---

## 🏢 Organization & Credits

Developed for **Media Prima Berhad**  
Managed by **Group Human Resources & Employee Engagement**  
Balai Berita, Anjung Riong, 31 Jalan Riong, Bangsar, 59100 Kuala Lumpur  

**Live AI Studio App:** [https://ai.studio/apps/e0d4423f-87ae-4468-8da5-899ccd1b597c](https://ai.studio/apps/e0d4423f-87ae-4468-8da5-899ccd1b597c)
