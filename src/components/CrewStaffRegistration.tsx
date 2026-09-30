import React, { useState } from 'react';
import { VendorApplication, SalesCategory } from '../types';
import {
  BadgeCheck,
  Building,
  Mail,
  Phone,
  CheckCircle2,
  Users,
  UserPlus,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Info,
  Copy,
  Check,
} from 'lucide-react';

interface CrewMemberItem {
  id: string;
  name: string;
  icNumber: string;
  email: string;
  phone: string;
}

interface CrewStaffRegistrationProps {
  onSubmitSuccess: (newApp: VendorApplication) => void;
  onSubmitMultipleSuccess?: (newApps: VendorApplication[]) => void;
  onNavigateToDashboard?: () => void;
}

const MPB_DEPARTMENTS = [
  'Media Prima Television Networks (TV3, 8TV, TV9)',
  'New Straits Times Press (NSTP / Berita Harian / Harian Metro)',
  'Rev Media Group (Vocket, SAYS, Viralcham, Rojaklah)',
  'Big Tree Outdoor Advertising',
  'Media Prima Audio (Hot FM, Fly FM, Buletin FM, Molek FM)',
  'Group Human Resources & Employee Engagement',
  'Broadcast Engineering & Digital Operations',
  'Kelab Media Prima Berhad Committee',
  'Lain-lain / Jabatan Lain',
];

export const CrewStaffRegistration: React.FC<CrewStaffRegistrationProps> = ({
  onSubmitSuccess,
  onSubmitMultipleSuccess,
  onNavigateToDashboard,
}) => {
  // Up to 6 crew members with shared booth and department details
  const [crewMembers, setCrewMembers] = useState<CrewMemberItem[]>([
    { id: '1', name: '', icNumber: '', email: '', phone: '' },
  ]);

  // Shared booth & event info
  const [department, setDepartment] = useState(MPB_DEPARTMENTS[0]);
  const [boothName, setBoothName] = useState('Kelab Media Prima - Staf Bazar Seloka');
  const [salesCategory, setSalesCategory] = useState<SalesCategory>('Food & Beverages (F&B)');
  const [itemDescription, setItemDescription] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [agreedToPdpa, setAgreedToPdpa] = useState(false);

  // Validation errors & feedback
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedRecords, setSubmittedRecords] = useState<VendorApplication[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Add another crew member (max 6)
  const handleAddMember = () => {
    if (crewMembers.length >= 6) return;
    setCrewMembers((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: '',
        icNumber: '',
        email: '',
        phone: '',
      },
    ]);
  };

  // Remove a crew member (minimum 1)
  const handleRemoveMember = (indexToRemove: number) => {
    if (crewMembers.length <= 1) return;
    setCrewMembers((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Update specific crew member attribute
  const handleUpdateMember = (
    index: number,
    field: keyof CrewMemberItem,
    value: string
  ) => {
    setCrewMembers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    // Clear specific error on typing
    const errorKey = `member_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });
    }
  };

  // Form validation
  const validate = () => {
    const newErrors: Record<string, string> = {};

    crewMembers.forEach((member, index) => {
      if (!member.name.trim()) {
        newErrors[`member_${index}_name`] = `Nama ahli kru #${index + 1} diperlukan.`;
      }
      if (!member.icNumber.trim()) {
        newErrors[`member_${index}_icNumber`] = `No. Kad Pengenalan / Staff ID diperlukan.`;
      }
      if (!member.email.trim() || !member.email.includes('@')) {
        newErrors[`member_${index}_email`] = `Emel rasmi / korporat sah diperlukan.`;
      }
      if (!member.phone.trim()) {
        newErrors[`member_${index}_phone`] = `No. telefon diperlukan.`;
      }
    });

    if (!boothName.trim()) {
      newErrors.boothName = 'Nama gerai / projek perniagaan diperlukan.';
    }

    if (!agreedToPdpa) {
      newErrors.agreedToPdpa = 'Persetujuan terhadap garis panduan HR MPB dan PDPA diperlukan.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Multi-Registration submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const batchId = `BATCH-MPB-CREW-${randomSuffix}`;
    const timestamp = new Date().toISOString();

    const newApplications: VendorApplication[] = crewMembers.map((member, idx) => {
      const codeSuffix =
        crewMembers.length === 1
          ? `${randomSuffix}`
          : `${randomSuffix}-${String(idx + 1).padStart(2, '0')}`;

      return {
        id: `app-crew-${Date.now()}-${idx}`,
        referenceCode: `MPB-CREW-2025-${codeSuffix}`,
        applicantName: member.name.trim(),
        businessName: boothName.trim() || `${member.name.trim()} (Kelab MPB)`,
        email: member.email.trim().toLowerCase(),
        phone: member.phone.trim(),
        vendorCategory: 'Kelab Media Prima Berhad',
        preferredMonth: 'Bazar Seloka (Official Event Crew)',
        salesItemType: salesCategory,
        specifiedItemDescription: itemDescription.trim() || undefined,
        tableCount: 1,
        chairQuantity: 'Not Required', // Removed per user request
        additionalNotes: additionalNotes.trim() || undefined,
        isStaff: true,
        staffId: member.icNumber.trim(),
        icNumber: member.icNumber.trim(),
        department: department.trim(),
        groupBatchId: crewMembers.length > 1 ? batchId : undefined,
        crewIndex: idx + 1,
        totalCrewInBatch: crewMembers.length,
        agreedToPdpa: true,
        submittedAt: timestamp,
        status: 'Pending',
      };
    });

    if (onSubmitMultipleSuccess) {
      onSubmitMultipleSuccess(newApplications);
    } else {
      newApplications.forEach((app) => onSubmitSuccess(app));
    }

    setSubmittedRecords(newApplications);
    setShowSuccessModal(true);

    // Reset form
    setCrewMembers([{ id: '1', name: '', icNumber: '', email: '', phone: '' }]);
    setAdditionalNotes('');
    setAgreedToPdpa(false);
    setErrors({});
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Top Banner for Internal Staff & Crew */}
      <div className="bg-[#eff6ff] rounded-2xl border border-[#bfdbfe] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#dbeafe] text-[#1d4ed8] flex items-center justify-center shrink-0">
            <BadgeCheck className="w-6 h-6 text-[#1d4ed8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1e40af] uppercase tracking-wider">
                Pendaftaran Staf & Kru Media Prima Berhad
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dbeafe] text-[#1e40af]">
                Laluan Khas HR (Maksimum 6 Kru)
              </span>
            </div>
            <p className="text-xs text-[#3b82f6] mt-0.5 leading-relaxed">
              Daftar sehingga <strong>6 orang kru</strong> serentak di bawah satu gerai / tugasan yang sama. Semua maklumat disimpan terus ke Firebase.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 border border-[#bfdbfe] text-xs font-semibold text-[#1e40af] shrink-0">
          <Users className="w-4 h-4 text-[#1d4ed8]" />
          <span>{crewMembers.length} / 6 Kru Didaftarkan</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 sm:p-8 shadow-xs space-y-8">
        {/* Header Title */}
        <div className="border-b border-[#f1f5f9] pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#0f172a] font-display">
                Borang Pendaftaran Staf & Kru Bazar Seloka
              </h1>
              <p className="text-xs sm:text-[13px] text-[#64748b] mt-1">
                Kongsikan maklumat gerai / tugasan yang sama untuk sehingga 6 orang kru Media Prima Berhad.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddMember}
                disabled={crewMembers.length >= 6}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  crewMembers.length >= 6
                    ? 'bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed border border-[#e2e8f0]'
                    : 'bg-[#fef2f2] text-[#d61b22] hover:bg-[#fee2e2] border border-[#fecaca] cursor-pointer'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Kru ({crewMembers.length}/6)</span>
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1: Shared Booth / Activity Details */}
          <div className="space-y-4 bg-[#f8fafc] p-5 rounded-xl border border-[#e2e8f0]">
            <div className="flex items-center gap-2 pb-2 border-b border-[#e2e8f0]">
              <Building className="w-4 h-4 text-[#d61b22]" />
              <h2 className="text-sm font-bold text-[#0f172a] font-display uppercase tracking-wide">
                1. Maklumat Bersama Gerai & Tugasan (Kandungan Sama Untuk Semua Kru)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#0f172a]">
                  Nama Gerai / Projek Kelab MPB <span className="text-[#d61b22]">*</span>
                </label>
                <input
                  type="text"
                  value={boothName}
                  onChange={(e) => setBoothName(e.target.value)}
                  placeholder="Contoh: Kelab MPB - Food & Drinks Booth"
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg focus:outline-none transition-colors ${
                    errors.boothName ? 'border-[#ef4444] bg-[#fef2f2]' : 'border-[#cbd5e1] focus:border-[#d61b22]'
                  }`}
                />
                {errors.boothName && (
                  <p className="text-xs text-[#dc2626]">{errors.boothName}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#0f172a]">
                  Jabatan / Entiti Media Prima <span className="text-[#d61b22]">*</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#cbd5e1] rounded-lg focus:border-[#d61b22] focus:outline-none"
                >
                  {MPB_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#0f172a]">
                  Kategori Jualan / Tugasan
                </label>
                <select
                  value={salesCategory}
                  onChange={(e) => setSalesCategory(e.target.value as SalesCategory)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#cbd5e1] rounded-lg focus:border-[#d61b22] focus:outline-none"
                >
                  <option value="Food & Beverages (F&B)">Food & Beverages (F&B)</option>
                  <option value="Apparel & Fashion">Apparel & Fashion</option>
                  <option value="Crafts & Accessories">Crafts & Accessories</option>
                  <option value="Services & Lifestyle">Services & Lifestyle / Duty Operations</option>
                  <option value="Others">Lain-lain / Promosi Khas</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#0f172a]">
                  Penerangan Barangan / Perkhidmatan (Pilihan)
                </label>
                <input
                  type="text"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Contoh: Nasi lemak daun pisang, pencuci mulut, merchandise kelab"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#cbd5e1] rounded-lg focus:border-[#d61b22] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Crew Members Registration Cards */}
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-1 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#d61b22]" />
                <h2 className="text-sm font-bold text-[#0f172a] font-display uppercase tracking-wide">
                  2. Senarai Ahli Kru Yang Didaftarkan ({crewMembers.length} daripada Maksimum 6)
                </h2>
              </div>

              {crewMembers.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#d61b22] hover:text-[#b9141a] cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Tambah Kru Seterusnya</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              {crewMembers.map((member, index) => {
                const isLead = index === 0;
                return (
                  <div
                    key={member.id}
                    className={`p-4 sm:p-5 rounded-xl border transition-all ${
                      isLead
                        ? 'border-[#cbd5e1] bg-white shadow-2xs'
                        : 'border-[#e2e8f0] bg-[#ffffff] hover:border-[#cbd5e1]'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#f1f5f9]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isLead
                              ? 'bg-[#d61b22] text-white'
                              : 'bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0]'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-[#0f172a]">
                          {isLead ? 'Kru 1 (Ketua / Pemohon Utama)' : `Kru ${index + 1}`}
                        </span>
                        {isLead && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fef2f2] text-[#d61b22] border border-[#fecaca]">
                            Ketua Pasukan
                          </span>
                        )}
                      </div>

                      {!isLead && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(index)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#ef4444] hover:bg-[#fef2f2] rounded-md transition-colors cursor-pointer"
                          title="Padam Kru Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline font-medium">Buang</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-[#334155]">
                          Nama Penuh <span className="text-[#d61b22]">*</span>
                        </label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) =>
                            handleUpdateMember(index, 'name', e.target.value)
                          }
                          placeholder="e.g. Nurul Huda binti Othman"
                          className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none transition-colors ${
                            errors[`member_${index}_name`]
                              ? 'border-[#ef4444] bg-[#fef2f2]'
                              : 'border-[#cbd5e1] focus:border-[#d61b22]'
                          }`}
                        />
                        {errors[`member_${index}_name`] && (
                          <p className="text-[10px] text-[#dc2626]">
                            {errors[`member_${index}_name`]}
                          </p>
                        )}
                      </div>

                      {/* IC Number */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-[#334155]">
                          No. Kad Pengenalan / Staff ID <span className="text-[#d61b22]">*</span>
                        </label>
                        <input
                          type="text"
                          value={member.icNumber}
                          onChange={(e) =>
                            handleUpdateMember(index, 'icNumber', e.target.value)
                          }
                          placeholder="e.g. 950812-14-5678 / MP10452"
                          className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none transition-colors ${
                            errors[`member_${index}_icNumber`]
                              ? 'border-[#ef4444] bg-[#fef2f2]'
                              : 'border-[#cbd5e1] focus:border-[#d61b22]'
                          }`}
                        />
                        {errors[`member_${index}_icNumber`] && (
                          <p className="text-[10px] text-[#dc2626]">
                            {errors[`member_${index}_icNumber`]}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-[#334155]">
                          Emel Rasmi <span className="text-[#d61b22]">*</span>
                        </label>
                        <input
                          type="email"
                          value={member.email}
                          onChange={(e) =>
                            handleUpdateMember(index, 'email', e.target.value)
                          }
                          placeholder="e.g. nurulhuda@mediaprima.com.my"
                          className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none transition-colors ${
                            errors[`member_${index}_email`]
                              ? 'border-[#ef4444] bg-[#fef2f2]'
                              : 'border-[#cbd5e1] focus:border-[#d61b22]'
                          }`}
                        />
                        {errors[`member_${index}_email`] && (
                          <p className="text-[10px] text-[#dc2626]">
                            {errors[`member_${index}_email`]}
                          </p>
                        )}
                      </div>

                      {/* Phone */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-[#334155]">
                          No. Telefon <span className="text-[#d61b22]">*</span>
                        </label>
                        <input
                          type="tel"
                          value={member.phone}
                          onChange={(e) =>
                            handleUpdateMember(index, 'phone', e.target.value)
                          }
                          placeholder="e.g. +6013-9876543"
                          className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none transition-colors ${
                            errors[`member_${index}_phone`]
                              ? 'border-[#ef4444] bg-[#fef2f2]'
                              : 'border-[#cbd5e1] focus:border-[#d61b22]'
                          }`}
                        />
                        {errors[`member_${index}_phone`] && (
                          <p className="text-[10px] text-[#dc2626]">
                            {errors[`member_${index}_phone`]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {crewMembers.length < 6 && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="w-full py-3 rounded-xl border border-dashed border-[#cbd5e1] hover:border-[#d61b22] hover:bg-[#fef2f2]/40 text-[#475569] hover:text-[#d61b22] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Tambah Ahli Kru Lagi ({crewMembers.length} / 6)</span>
                </button>
              </div>
            )}
          </div>

          {/* SECTION 3: Additional Remarks (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#0f172a]">
              Catatan Tambahan / Syif Tugasan / Keperluan Khas (Pilihan)
            </label>
            <textarea
              rows={3}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Contoh: Jadual syif pagi/petang kru, masa persediaan bahan, bekalan elektrik..."
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#cbd5e1] rounded-lg focus:border-[#d61b22] focus:outline-none transition-colors"
            ></textarea>
          </div>

          {/* PDPA Agreement */}
          <div className="space-y-1 bg-[#f8fafc] p-4 rounded-xl border border-[#e2e8f0]">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToPdpa}
                onChange={(e) => setAgreedToPdpa(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[#cbd5e1] text-[#d61b22] focus:ring-[#d61b22]"
              />
              <span className="text-xs text-[#475569] leading-relaxed">
                Saya mengesahkan bahawa semua penama yang disenaraikan adalah staf / kru aktif Media Prima Berhad dan bersetuju mematuhi kod tata kelakuan HR, garis panduan keselamatan bazar, dan akta PDPA.
              </span>
            </label>
            {errors.agreedToPdpa && (
              <p className="text-xs text-[#dc2626] pl-7">{errors.agreedToPdpa}</p>
            )}
          </div>

          {/* Submit Row */}
          <div className="pt-4 border-t border-[#f1f5f9] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#64748b]">
              <ShieldCheck className="w-4 h-4 text-[#10b981]" />
              <span>Semua {crewMembers.length} rekod akan didaftarkan serentak ke Firebase Firestore</span>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#d61b22] hover:bg-[#b9141a] text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
            >
              <span>Hantar {crewMembers.length} Pendaftaran Kru</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Success Dialog */}
      {showSuccessModal && submittedRecords.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-xl border border-[#e2e8f0] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#ecfdf5] text-[#10b981] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-[#10b981]" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#0f172a] font-display">
                {submittedRecords.length} Pendaftaran Kru Berjaya Dihantar!
              </h3>
              <p className="text-xs text-[#64748b] mt-1">
                Semua rekod telah disimpan ke dalam sistem Firebase Firestore di bawah gerai: <strong>{submittedRecords[0].businessName}</strong>.
              </p>
            </div>

            {/* List of reference codes generated */}
            <div className="bg-[#f8fafc] p-3.5 rounded-xl border border-[#e2e8f0] text-left space-y-2 max-h-56 overflow-y-auto">
              <div className="text-[11px] font-bold text-[#475569] uppercase tracking-wider pb-1 border-b border-[#e2e8f0]">
                Kod Rujukan Kru ({submittedRecords.length} Orang):
              </div>
              {submittedRecords.map((rec, i) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-[#e2e8f0] text-xs"
                >
                  <div className="truncate">
                    <span className="font-bold text-[#0f172a] block truncate">
                      {i + 1}. {rec.applicantName}
                    </span>
                    <span className="font-mono text-[11px] text-[#2563eb]">
                      {rec.referenceCode}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCode(rec.referenceCode, i)}
                    className="p-1.5 rounded-md hover:bg-[#f1f5f9] text-[#64748b] shrink-0 transition-colors"
                    title="Salin Kod Rujukan"
                  >
                    {copiedIndex === i ? (
                      <Check className="w-4 h-4 text-[#10b981]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-[#cbd5e1] text-xs font-semibold text-[#334155] hover:bg-[#f8fafc]"
              >
                Tutup
              </button>
              {onNavigateToDashboard && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    onNavigateToDashboard();
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-[#d61b22] hover:bg-[#b9141a] text-white text-xs font-semibold shadow-xs"
                >
                  Lihat di Dashboard Admin
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
