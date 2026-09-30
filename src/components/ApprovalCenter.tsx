import React, { useState, useMemo } from 'react';
import {
  VendorApplication,
  VendorStatus,
  OutboxEmail,
  VendorCategory,
  VENDOR_CATEGORIES,
} from '../types';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Mail,
  Building,
  User,
  Phone,
  Calendar,
  AlertTriangle,
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  Users,
  UserPlus,
  Shield,
  Trash2,
  UserCheck,
  Check,
  Lock,
  Store,
  Ticket,
  Printer,
  QrCode,
  BadgeCheck,
} from 'lucide-react';
import { AdminUser } from '../types';

interface ApprovalCenterProps {
  applications: VendorApplication[];
  onUpdateStatus: (
    applicationId: string,
    newStatus: VendorStatus,
    reason?: string
  ) => void;
  onViewOutbox: () => void;
  adminUser: AdminUser | null;
  admins: AdminUser[];
  onAddAdmin?: (newAdmin: AdminUser) => Promise<void>;
  onDeleteAdmin?: (adminId: string) => Promise<void>;
  onSwitchAdmin?: (admin: AdminUser) => void;
  onNavigateToCrewRegister?: () => void;
}

export const ApprovalCenter: React.FC<ApprovalCenterProps> = ({
  applications,
  onUpdateStatus,
  onViewOutbox,
  adminUser,
  admins,
  onAddAdmin,
  onDeleteAdmin,
  onSwitchAdmin,
  onNavigateToCrewRegister,
}) => {
  const [dashboardTab, setDashboardTab] = useState<'all-vendors' | 'crew-registrations'>('all-vendors');
  const [crewViewMode, setCrewViewMode] = useState<'grouped' | 'roster'>('grouped');
  const [crewSearchTerm, setCrewSearchTerm] = useState('');
  const [crewDeptFilter, setCrewDeptFilter] = useState('ALL');
  const [crewStatusFilter, setCrewStatusFilter] = useState<'ALL' | VendorStatus>('ALL');
  const [selectedCrewForPass, setSelectedCrewForPass] = useState<VendorApplication | null>(null);
  const [onlyShowCrewInGeneral, setOnlyShowCrewInGeneral] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('HR Committee Reviewer');
  const [newAdminDept, setNewAdminDept] = useState('Group Human Resources');
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [adminFormSuccess, setAdminFormSuccess] = useState<string | null>(null);
  const [adminFormError, setAdminFormError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | VendorStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState<'ALL' | VendorCategory>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedApp, setSelectedApp] = useState<VendorApplication | null>(null);
  const [rejectionModalApp, setRejectionModalApp] = useState<VendorApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Category capacity exceeded for current carnival cycle.');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);
  const [isDeletingAdmin, setIsDeletingAdmin] = useState(false);

  // Check if active user has Super Admin authority
  const isSuperAdmin = useMemo(() => {
    if (!adminUser) return false;
    const cleanRole = (adminUser.role || '').toLowerCase();
    const cleanEmail = (adminUser.email || '').toLowerCase();
    return (
      cleanRole === 'super admin' ||
      cleanRole.includes('super') ||
      cleanEmail === 'mirfan6874@gmail.com' ||
      cleanEmail === 'farah.yasmin@mediaprima.com.my'
    );
  }, [adminUser]);

  // Helper to determine if an application belongs to internal MPB Crew / Staff
  const isCrewApp = (app: VendorApplication) => {
    return (
      app.isStaff === true ||
      Boolean(app.referenceCode && app.referenceCode.includes('CREW')) ||
      app.vendorCategory === 'Kelab Media Prima Berhad' ||
      Boolean(app.preferredMonth && app.preferredMonth.toLowerCase().includes('crew'))
    );
  };

  // Crew applications & metrics
  const crewApplications = useMemo(() => applications.filter(isCrewApp), [applications]);
  const crewStats = useMemo(() => {
    const total = crewApplications.length;
    const pending = crewApplications.filter((a) => a.status === 'Pending').length;
    const approved = crewApplications.filter((a) => a.status === 'Approved').length;
    const rejected = crewApplications.filter((a) => a.status === 'Rejected').length;
    return { total, pending, approved, rejected };
  }, [crewApplications]);

  // Grouped crew by batch or booth
  const crewBatches = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        batchCode?: string;
        businessName: string;
        department: string;
        salesCategory: string;
        additionalNotes?: string;
        submittedAt: string;
        members: VendorApplication[];
      }
    >();

    crewApplications.forEach((app) => {
      const key = app.groupBatchId || `${app.businessName}_${app.department || ''}`;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          batchCode: app.groupBatchId,
          businessName: app.businessName,
          department: app.department || 'Media Prima Staff Operations',
          salesCategory: app.salesItemType,
          additionalNotes: app.additionalNotes,
          submittedAt: app.submittedAt,
          members: [],
        });
      }
      map.get(key)!.members.push(app);
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }, [crewApplications]);

  // Filtered crew for dedicated Crew Management Console
  const filteredCrew = useMemo(() => {
    return crewApplications.filter((app) => {
      const term = crewSearchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        app.applicantName.toLowerCase().includes(term) ||
        app.businessName.toLowerCase().includes(term) ||
        app.referenceCode.toLowerCase().includes(term) ||
        app.email.toLowerCase().includes(term) ||
        Boolean(app.icNumber && app.icNumber.toLowerCase().includes(term)) ||
        Boolean(app.staffId && app.staffId.toLowerCase().includes(term));

      const matchesStatus =
        crewStatusFilter === 'ALL' || app.status === crewStatusFilter;

      const matchesDept =
        crewDeptFilter === 'ALL' ||
        Boolean(app.department && app.department.toLowerCase().includes(crewDeptFilter.toLowerCase()));

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [crewApplications, crewSearchTerm, crewStatusFilter, crewDeptFilter]);

  // Compute overall metrics
  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((a) => a.status === 'Pending').length;
    const approved = applications.filter((a) => a.status === 'Approved').length;
    const rejected = applications.filter((a) => a.status === 'Rejected').length;
    return { total, pending, approved, rejected };
  }, [applications]);

  // Filtered applications for main table
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (onlyShowCrewInGeneral && !isCrewApp(app)) return false;

      const matchesSearch =
        app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.referenceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Boolean(app.icNumber && app.icNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' ? true : app.status === statusFilter;

      const matchesCategory =
        categoryFilter === 'ALL' ? true : app.salesItemType === categoryFilter;

      const matchesMonth =
        monthFilter === 'ALL' ? true : app.preferredMonth.toLowerCase().includes(monthFilter.toLowerCase());

      const matchesVendorCategory =
        vendorCategoryFilter === 'ALL' ? true : app.vendorCategory === vendorCategoryFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesMonth && matchesVendorCategory;
    });
  }, [applications, searchTerm, statusFilter, categoryFilter, monthFilter, vendorCategoryFilter, onlyShowCrewInGeneral]);

  // Batch approve all crew in a team
  const handleApproveCrewBatch = (batch: {
    id: string;
    businessName: string;
    members: VendorApplication[];
  }) => {
    const toApprove = batch.members.filter((m) => m.status !== 'Approved');
    if (toApprove.length === 0) return;
    toApprove.forEach((member) => {
      onUpdateStatus(member.id, 'Approved');
    });
    setActionNotice(
      `Semua ${toApprove.length} ahli kru bagi "${batch.businessName}" telah diluluskan! Emel pengesahan dan pas telah dijana.`
    );
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Export Crew-specific CSV
  const exportCrewCSV = () => {
    const headers = [
      'Reference Code',
      'Crew Member Name',
      'IC / Staff ID',
      'Department / Entity',
      'Booth / Project Assignment',
      'Email',
      'Phone',
      'Batch ID',
      'Status',
      'Submitted At',
    ];

    const rows = crewApplications.map((a) => [
      `"${a.referenceCode}"`,
      `"${a.applicantName}"`,
      `"${a.icNumber || a.staffId || ''}"`,
      `"${a.department || ''}"`,
      `"${a.businessName}"`,
      `"${a.email}"`,
      `"${a.phone}"`,
      `"${a.groupBatchId || 'Individual'}"`,
      `"${a.status}"`,
      `"${a.submittedAt}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MPB_Crew_Registrations_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Batch actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredApplications.map((a) => a.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchApprove = () => {
    const toApprove = applications.filter(
      (a) => selectedIds.has(a.id) && a.status === 'Pending'
    );
    if (toApprove.length === 0) return;

    toApprove.forEach((app) => {
      onUpdateStatus(app.id, 'Approved');
    });
    setActionNotice(
      `Batch approved ${toApprove.length} application(s)! Confirmation emails generated.`
    );
    setTimeout(() => setActionNotice(null), 5000);
    setSelectedIds(new Set());
  };

  const handleBatchReject = () => {
    const toReject = applications.filter(
      (a) => selectedIds.has(a.id) && a.status === 'Pending'
    );
    if (toReject.length === 0) return;

    toReject.forEach((app) => {
      onUpdateStatus(app.id, 'Rejected', 'Category capacity reached for selected cycle.');
    });
    setActionNotice(`Batch rejected ${toReject.length} application(s).`);
    setTimeout(() => setActionNotice(null), 5000);
    setSelectedIds(new Set());
  };

  const handleApprove = (app: VendorApplication) => {
    onUpdateStatus(app.id, 'Approved');
    setActionNotice(
      `Application ${app.referenceCode} (${app.businessName}) Approved! Automated confirmation email generated in Outbox.`
    );
    setTimeout(() => setActionNotice(null), 6000);
    if (selectedApp?.id === app.id) {
      setSelectedApp({ ...app, status: 'Approved' });
    }
  };

  const handleOpenReject = (app: VendorApplication) => {
    setRejectionModalApp(app);
  };

  const handleConfirmReject = () => {
    if (!rejectionModalApp) return;
    onUpdateStatus(rejectionModalApp.id, 'Rejected', rejectionReason);
    setActionNotice(`Application ${rejectionModalApp.referenceCode} set to Rejected.`);
    setTimeout(() => setActionNotice(null), 5000);
    setRejectionModalApp(null);
    if (selectedApp?.id === rejectionModalApp.id) {
      setSelectedApp({ ...rejectionModalApp, status: 'Rejected' });
    }
  };

  const handleResetToPending = (app: VendorApplication) => {
    onUpdateStatus(app.id, 'Pending');
    setActionNotice(`Application ${app.referenceCode} reset back to Pending Review.`);
    setTimeout(() => setActionNotice(null), 4000);
    if (selectedApp?.id === app.id) {
      setSelectedApp({ ...app, status: 'Pending' });
    }
  };

  const handleConfirmDeleteAdmin = async () => {
    if (!adminToDelete || !onDeleteAdmin) return;
    setIsDeletingAdmin(true);
    setAdminFormError(null);
    setAdminFormSuccess(null);
    try {
      const targetId = adminToDelete.id || adminToDelete.email;
      await onDeleteAdmin(targetId);
      setAdminFormSuccess(`Akses admin untuk "${adminToDelete.name}" (${adminToDelete.email}) telah berjaya dipadam daripada Firebase.`);
      setAdminToDelete(null);
    } catch {
      setAdminFormError('Gagal memadam rekod admin daripada Firebase. Sila cuba lagi.');
    } finally {
      setIsDeletingAdmin(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      'Reference Code',
      'Applicant Name',
      'Business Name',
      'Vendor Category',
      'Email',
      'Phone',
      'Sales Category',
      'Month',
      'Status',
      'Submitted At',
    ];

    const rows = applications.map((a) => [
      `"${a.referenceCode}"`,
      `"${a.applicantName}"`,
      `"${a.businessName}"`,
      `"${a.vendorCategory}"`,
      `"${a.email}"`,
      `"${a.phone}"`,
      `"${a.salesItemType}"`,
      `"${a.preferredMonth}"`,
      `"${a.status}"`,
      `"${a.submittedAt}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MPB_Vendor_Applications_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Top Banner / Notification */}
      {actionNotice && (
        <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl p-4 flex items-center justify-between gap-4 text-xs sm:text-sm text-[#065f46] animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-[#10b981] shrink-0" />
            <span className="font-medium">{actionNotice}</span>
          </div>
          <button
            onClick={onViewOutbox}
            className="px-3 py-1.5 rounded-lg bg-[#065f46] hover:bg-[#044e39] text-white font-semibold text-xs whitespace-nowrap cursor-pointer transition-colors"
          >
            Open Outbox →
          </button>
        </div>
      )}

      {/* Page Title & Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d61b22]"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#d61b22]">
              Super Admin Console • Group Human Resources
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172a] font-display tracking-tight mt-1">
            Bazar Seloka Approval Center
          </h1>
          <p className="text-xs sm:text-[13px] text-[#64748b]">
            Review incoming vendor registrations for Bazar Seloka 2025. Powered by Group Human Resources, Media Prima Berhad.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowAdminModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Pasukan Admin ({admins.length})</span>
          </button>

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#cbd5e1] text-xs font-semibold text-[#334155] hover:bg-[#f8fafc] transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#64748b]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onViewOutbox}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#d61b22] hover:bg-[#b9141a] text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>Simulated Outbox</span>
          </button>
        </div>
      </div>

      {/* Active Admin Session Bar */}
      <div className="bg-white rounded-xl border border-[#cbd5e1] p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img
              src={
                adminUser?.avatar ||
                'https://api.dicebear.com/7.x/avataaars/svg?seed=' +
                  encodeURIComponent(adminUser?.name || 'Admin')
              }
              alt={adminUser?.name || 'Admin'}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#d61b22]/30 shadow-xs"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin';
              }}
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-[#0f172a]">
                {adminUser?.name || 'Irfan (Super Admin)'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#e8edfc] text-[#3b4975] border border-[#d0dcfc]">
                {adminUser?.role || 'Super Admin'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Sesi Kelulusan Aktif • Firestore Realtime
              </span>
            </div>
            <p className="text-[11.5px] text-[#64748b] mt-0.5">
              Emel: <span className="font-mono text-slate-700">{adminUser?.email || 'mirfan6874@gmail.com'}</span> • Jabatan: {adminUser?.department || 'Media Prima Group HR'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAdminModal(true)}
            className="text-xs font-semibold text-[#0f172a] hover:text-[#d61b22] px-3 py-1.5 rounded-lg border border-[#cbd5e1] hover:bg-[#f8fafc] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#d61b22]" />
            <span>Senarai & Tukar Pegawai Sesi</span>
          </button>
        </div>
      </div>

      {/* View Switcher: All Vendors vs Staff & Crew Console */}
      <div className="bg-white rounded-2xl border border-[#cbd5e1] p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 p-1 bg-[#f1f5f9] rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setDashboardTab('all-vendors')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              dashboardTab === 'all-vendors'
                ? 'bg-white text-[#0f172a] shadow-xs'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            <Store className="w-4 h-4 text-[#d61b22]" />
            <span>Permohonan Vendor & Peniaga</span>
            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]">
              {applications.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setDashboardTab('crew-registrations')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              dashboardTab === 'crew-registrations'
                ? 'bg-[#1e40af] text-white shadow-xs'
                : 'text-[#1e40af] hover:bg-[#dbeafe]/60'
            }`}
          >
            <Users className="w-4 h-4 text-[#3b82f6]" />
            <span>Pendaftaran Staf & Kru MPB</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold ${
                dashboardTab === 'crew-registrations'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#dbeafe] text-[#1e40af]'
              }`}
            >
              {crewApplications.length} Kru
            </span>
            {crewStats.pending > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#f59e0b] text-white animate-pulse">
                {crewStats.pending} Menunggu
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {dashboardTab === 'crew-registrations' ? (
            <div className="flex items-center gap-2">
              {onNavigateToCrewRegister && (
                <button
                  type="button"
                  onClick={onNavigateToCrewRegister}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d61b22] hover:bg-[#b9141a] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Borang Pendaftaran Kru</span>
                </button>
              )}
              <button
                type="button"
                onClick={exportCrewCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#cbd5e1] text-[#334155] hover:bg-[#f8fafc] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#64748b]" />
                <span>Eksport Roster Kru</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setOnlyShowCrewInGeneral(!onlyShowCrewInGeneral)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                onlyShowCrewInGeneral
                  ? 'bg-[#eff6ff] text-[#1e40af] border-[#bfdbfe]'
                  : 'bg-white text-[#475569] border-[#cbd5e1] hover:bg-[#f8fafc]'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#2563eb]" />
              <span>{onlyShowCrewInGeneral ? 'Menapis: Staf & Kru Sahaja' : 'Tapis Staf & Kru Sahaja'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#dbeafe] text-[#1e40af]">
                {crewApplications.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* DEDICATED CREW REGISTRATION INTERFACE */}
      {dashboardTab === 'crew-registrations' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Top Banner specifically for Crew Console */}
          <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#dbeafe] text-[#1d4ed8] flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-[#1d4ed8]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1e40af] uppercase tracking-wider">
                    Konsol Pengurusan Staf & Kru Bazar Seloka 2025
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dbeafe] text-[#1e40af]">
                    Kelab Media Prima Berhad
                  </span>
                </div>
                <p className="text-xs text-[#3b82f6] mt-0.5 leading-relaxed">
                  Semak, luluskan, dan cetak pas masuk rasmi untuk semua penama staf dan kru bertugas mengikut gerai / jabatan (sehingga 6 orang setiap gerai).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-white/90 border border-[#bfdbfe] px-3.5 py-2 rounded-xl text-right">
                <span className="text-[11px] text-[#64748b] block font-medium">Pasukan Didaftarkan</span>
                <span className="text-base font-bold font-mono text-[#1e40af]">
                  {crewBatches.length} Kumpulan Gerai
                </span>
              </div>
            </div>
          </div>

          {/* Crew Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Crew */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-4.5 shadow-2xs space-y-1">
              <span className="text-xs font-medium text-[#64748b]">Jumlah Keseluruhan Kru</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-[#0f172a] tabular-nums">
                  {crewStats.total}
                </span>
                <span className="text-[11px] text-[#64748b]">{crewBatches.length} Pasukan</span>
              </div>
            </div>

            {/* Pending Crew */}
            <div
              onClick={() => setCrewStatusFilter('Pending')}
              className={`cursor-pointer bg-white rounded-xl border p-4.5 shadow-2xs space-y-1 transition-all ${
                crewStatusFilter === 'Pending' ? 'border-[#f59e0b] ring-2 ring-[#f59e0b]/20' : 'border-[#e2e8f0]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#b45309]">Menunggu Kelulusan HR</span>
                {crewStats.pending > 0 && <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-ping"></span>}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-[#d97706] tabular-nums">
                  {crewStats.pending}
                </span>
                <span className="text-[11px] text-[#b45309] font-medium">Perlu tindakan</span>
              </div>
            </div>

            {/* Approved Crew */}
            <div
              onClick={() => setCrewStatusFilter('Approved')}
              className={`cursor-pointer bg-white rounded-xl border p-4.5 shadow-2xs space-y-1 transition-all ${
                crewStatusFilter === 'Approved' ? 'border-[#10b981] ring-2 ring-[#10b981]/20' : 'border-[#e2e8f0]'
              }`}
            >
              <span className="text-xs font-semibold text-[#047857]">Kru Disahkan (Approved)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-[#10b981] tabular-nums">
                  {crewStats.approved}
                </span>
                <span className="text-[11px] text-[#047857] font-medium">Layak pas masuk</span>
              </div>
            </div>

            {/* Rejected Crew */}
            <div
              onClick={() => setCrewStatusFilter('Rejected')}
              className={`cursor-pointer bg-white rounded-xl border p-4.5 shadow-2xs space-y-1 transition-all ${
                crewStatusFilter === 'Rejected' ? 'border-[#ef4444] ring-2 ring-[#ef4444]/20' : 'border-[#e2e8f0]'
              }`}
            >
              <span className="text-xs font-semibold text-[#b91c1c]">Ditolak / Dibatalkan</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-[#ef4444] tabular-nums">
                  {crewStats.rejected}
                </span>
                <span className="text-[11px] text-[#64748b]">Permohonan batal</span>
              </div>
            </div>
          </div>

          {/* Crew Controls: Search, View Mode Toggle, Department Filter */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94a3b8]">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={crewSearchTerm}
                  onChange={(e) => setCrewSearchTerm(e.target.value)}
                  placeholder="Cari ahli kru mengikut Nama, IC, No. Telefon, Emel, atau Nama Gerai..."
                  className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm bg-white border border-[#cbd5e1] rounded-lg focus:border-[#d61b22] focus:outline-none"
                />
              </div>

              {/* View mode toggle: Grouped vs Flat Roster */}
              <div className="flex items-center gap-1 p-1 bg-[#f1f5f9] rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCrewViewMode('grouped')}
                  className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    crewViewMode === 'grouped'
                      ? 'bg-white text-[#0f172a] shadow-xs'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  <Building className="w-3.5 h-3.5 text-[#d61b22]" />
                  <span>Tinjauan Pasukan ({crewBatches.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCrewViewMode('roster')}
                  className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    crewViewMode === 'roster'
                      ? 'bg-white text-[#0f172a] shadow-xs'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-[#2563eb]" />
                  <span>Senarai Individu ({filteredCrew.length})</span>
                </button>
              </div>

              {/* Status Segmented Buttons */}
              <div className="flex items-center gap-1 p-1 bg-[#f1f5f9] rounded-lg text-xs font-semibold overflow-x-auto">
                <button
                  onClick={() => setCrewStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    crewStatusFilter === 'ALL'
                      ? 'bg-white text-[#0f172a] shadow-xs'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  Semua ({crewApplications.length})
                </button>
                <button
                  onClick={() => setCrewStatusFilter('Pending')}
                  className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                    crewStatusFilter === 'Pending'
                      ? 'bg-white text-[#b45309] shadow-xs'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  <span>Pending</span>
                  {crewStats.pending > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#fef3c7] text-[#b45309] text-[10px] flex items-center justify-center font-bold">
                      {crewStats.pending}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setCrewStatusFilter('Approved')}
                  className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    crewStatusFilter === 'Approved'
                      ? 'bg-white text-[#047857] shadow-xs'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  Approved ({crewStats.approved})
                </button>
                <button
                  onClick={() => setCrewStatusFilter('Rejected')}
                  className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    crewStatusFilter === 'Rejected'
                      ? 'bg-white text-[#b91c1c] shadow-xs'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  Rejected ({crewStats.rejected})
                </button>
              </div>
            </div>

            {/* Department quick filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#f1f5f9] scrollbar-none text-xs">
              <span className="text-[#64748b] text-[11px] font-semibold uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-[#d61b22]" /> Jabatan MPB:
              </span>
              {[
                { label: 'Semua Entiti', val: 'ALL' },
                { label: 'TV Networks (TV3/8TV/TV9)', val: 'Television' },
                { label: 'NSTP (BH/Metro)', val: 'NSTP' },
                { label: 'Rev Media Group', val: 'Rev' },
                { label: 'Big Tree', val: 'Big Tree' },
                { label: 'Media Prima Audio', val: 'Audio' },
                { label: 'Group HR', val: 'Human Resources' },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setCrewDeptFilter(item.val)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                    crewDeptFilter === item.val
                      ? 'bg-[#1e40af] text-white font-bold shadow-2xs'
                      : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-view: Grouped View (Cards by Booth/Batch) */}
          {crewViewMode === 'grouped' ? (
            <div className="space-y-4">
              {crewBatches.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#e2e8f0] p-12 text-center text-[#64748b]">
                  <p className="text-sm font-medium">Tiada pendaftaran kru ditemui dengan tapisan semasa.</p>
                </div>
              ) : (
                crewBatches.map((batch) => {
                  const pendingInBatch = batch.members.filter((m) => m.status === 'Pending').length;
                  const approvedInBatch = batch.members.filter((m) => m.status === 'Approved').length;

                  return (
                    <div
                      key={batch.id}
                      className="bg-white rounded-2xl border border-[#cbd5e1] p-5 sm:p-6 shadow-2xs space-y-4"
                    >
                      {/* Batch Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f1f5f9]">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]"></span>
                            <h3 className="text-base font-bold text-[#0f172a] font-display">
                              {batch.businessName}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#eff6ff] text-[#1e40af] border border-[#bfdbfe]">
                              {batch.members.length} Orang Kru
                            </span>
                            {batch.batchCode && (
                              <span className="font-mono text-[10px] text-[#64748b] bg-[#f8fafc] px-2 py-0.5 rounded border border-[#e2e8f0]">
                                {batch.batchCode}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#64748b] mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>🏢 {batch.department}</span>
                            <span>•</span>
                            <span>Kategori: {batch.salesCategory}</span>
                            <span>•</span>
                            <span>
                              Tarikh Daftar:{' '}
                              {new Date(batch.submittedAt).toLocaleDateString('ms-MY', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </p>
                        </div>

                        {/* Batch Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {pendingInBatch > 0 && (
                            <button
                              type="button"
                              onClick={() => handleApproveCrewBatch(batch)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                              title="Luluskan semua kru dalam gerai ini serentak"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Luluskan Semua ({pendingInBatch})</span>
                            </button>
                          )}
                          <span className="text-xs text-[#64748b]">
                            {approvedInBatch}/{batch.members.length} Disahkan
                          </span>
                        </div>
                      </div>

                      {/* Shared notes if any */}
                      {batch.additionalNotes && (
                        <div className="bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0] text-xs text-[#475569] italic flex items-start gap-2">
                          <span className="font-bold text-[#0f172a] not-italic shrink-0">Catatan Syif:</span>
                          <span>"{batch.additionalNotes}"</span>
                        </div>
                      )}

                      {/* Members Roster in this batch */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {batch.members.map((member, idx) => {
                          return (
                            <div
                              key={member.id}
                              className={`p-3.5 rounded-xl border transition-all ${
                                member.status === 'Approved'
                                  ? 'border-[#a7f3d0] bg-[#f0fdf4]/40'
                                  : member.status === 'Rejected'
                                  ? 'border-[#fecaca] bg-[#fef2f2]/40'
                                  : 'border-[#e2e8f0] bg-white'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#f1f5f9]">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-[#eff6ff] text-[#1d4ed8] text-[10px] font-bold flex items-center justify-center">
                                      {idx + 1}
                                    </span>
                                    <span className="font-bold text-xs text-[#0f172a]">
                                      {member.applicantName}
                                    </span>
                                  </div>
                                  <span className="font-mono text-[10px] text-[#2563eb] block mt-0.5">
                                    {member.referenceCode}
                                  </span>
                                </div>

                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                    member.status === 'Approved'
                                      ? 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]'
                                      : member.status === 'Rejected'
                                      ? 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'
                                      : 'bg-[#fffbeb] text-[#92400e] border border-[#fde68a]'
                                  }`}
                                >
                                  {member.status}
                                </span>
                              </div>

                              <div className="py-2 text-[11px] text-[#475569] space-y-1">
                                <p>
                                  <span className="text-[#64748b]">IC / Staff ID:</span>{' '}
                                  <strong className="text-[#0f172a]">{member.icNumber || member.staffId}</strong>
                                </p>
                                <p className="truncate">
                                  <span className="text-[#64748b]">Emel:</span> {member.email}
                                </p>
                                <p>
                                  <span className="text-[#64748b]">Tel:</span> {member.phone}
                                </p>
                              </div>

                              {/* Individual Member Actions */}
                              <div className="pt-2 border-t border-[#f1f5f9] flex items-center justify-between gap-1.5">
                                {member.status === 'Pending' ? (
                                  <div className="flex items-center gap-1.5 w-full">
                                    <button
                                      type="button"
                                      onClick={() => handleApprove(member)}
                                      className="flex-1 py-1 px-2 rounded-md bg-[#10b981] hover:bg-[#059669] text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      <span>Lulus</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenReject(member)}
                                      className="py-1 px-2 rounded-md border border-[#fca5a5] hover:bg-[#fef2f2] text-[#dc2626] text-[11px] font-semibold flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between w-full">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedCrewForPass(member)}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#eff6ff] hover:bg-[#dbeafe] text-[#1d4ed8] text-[11px] font-bold transition-colors cursor-pointer"
                                    >
                                      <Ticket className="w-3.5 h-3.5" />
                                      <span>Pas Masuk Kru</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleResetToPending(member)}
                                      className="text-[10px] text-[#64748b] hover:text-[#0f172a] hover:underline"
                                    >
                                      Reset
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Sub-view: Flat Roster Table */
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f8fafc] text-[#475569] font-semibold border-b border-[#e2e8f0] uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Kod Rujukan</th>
                      <th className="py-3 px-4">Nama Staf & IC / ID</th>
                      <th className="py-3 px-4">Emel & Telefon</th>
                      <th className="py-3 px-4">Gerai / Projek</th>
                      <th className="py-3 px-4">Jabatan MPB</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {filteredCrew.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-[#64748b]">
                          Tiada ahli kru dijumpai.
                        </td>
                      </tr>
                    ) : (
                      filteredCrew.map((crew) => (
                        <tr key={crew.id} className="hover:bg-[#f8fafc] transition-colors">
                          <td className="py-3 px-4 font-mono font-semibold text-[#0f172a]">
                            <span className="bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] px-2 py-0.5 rounded">
                              {crew.referenceCode}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#0f172a]">{crew.applicantName}</div>
                            <div className="text-[11px] text-[#64748b] font-mono">
                              IC: {crew.icNumber || crew.staffId}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[11px] text-[#475569]">
                            <div>{crew.email}</div>
                            <div className="text-[#64748b]">{crew.phone}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#0f172a]">{crew.businessName}</div>
                            {crew.totalCrewInBatch && crew.totalCrewInBatch > 1 && (
                              <span className="text-[10px] text-[#1d4ed8] font-medium">
                                Kru #{crew.crewIndex} drpd {crew.totalCrewInBatch}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#475569]">{crew.department}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                crew.status === 'Approved'
                                  ? 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]'
                                  : crew.status === 'Rejected'
                                  ? 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'
                                  : 'bg-[#fffbeb] text-[#92400e] border border-[#fde68a]'
                              }`}
                            >
                              {crew.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {crew.status === 'Pending' ? (
                                <>
                                  <button
                                    onClick={() => handleApprove(crew)}
                                    className="p-1.5 rounded-md bg-[#10b981] hover:bg-[#059669] text-white transition-colors cursor-pointer"
                                    title="Luluskan Kru"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenReject(crew)}
                                    className="p-1.5 rounded-md border border-[#fca5a5] hover:bg-[#fef2f2] text-[#dc2626] transition-colors cursor-pointer"
                                    title="Tolak Permohonan"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSelectedCrewForPass(crew)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#eff6ff] hover:bg-[#dbeafe] text-[#1d4ed8] text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                  <Ticket className="w-3.5 h-3.5" />
                                  <span>Pas Rasmi</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ALL VENDORS INTERFACE */}
      {dashboardTab === 'all-vendors' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-4.5 shadow-2xs space-y-1">
          <span className="text-xs font-medium text-[#64748b]">Total Submissions</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-[#0f172a] tabular-nums">
              {stats.total}
            </span>
            <span className="text-[11px] text-[#64748b]">All cycles</span>
          </div>
        </div>

        {/* Pending */}
        <div
          onClick={() => setStatusFilter('Pending')}
          className={`cursor-pointer bg-white rounded-xl border p-4.5 shadow-2xs space-y-1 transition-all ${
            statusFilter === 'Pending' ? 'border-[#f59e0b] ring-2 ring-[#f59e0b]/20' : 'border-[#e2e8f0]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#b45309]">Pending Review</span>
            <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-ping"></span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-[#d97706] tabular-nums">
              {stats.pending}
            </span>
            <span className="text-[11px] text-[#b45309] font-medium">Awaiting action</span>
          </div>
        </div>

        {/* Approved */}
        <div
          onClick={() => setStatusFilter('Approved')}
          className={`cursor-pointer bg-white rounded-xl border p-4.5 shadow-2xs space-y-1 transition-all ${
            statusFilter === 'Approved' ? 'border-[#10b981] ring-2 ring-[#10b981]/20' : 'border-[#e2e8f0]'
          }`}
        >
          <span className="text-xs font-semibold text-[#047857]">Approved Vendors</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-[#10b981] tabular-nums">
              {stats.approved}
            </span>
            <span className="text-[11px] text-[#047857] font-medium">Confirmed slots</span>
          </div>
        </div>

        {/* Rejected */}
        <div
          onClick={() => setStatusFilter('Rejected')}
          className={`cursor-pointer bg-white rounded-xl border p-4.5 shadow-2xs space-y-1 transition-all ${
            statusFilter === 'Rejected' ? 'border-[#ef4444] ring-2 ring-[#ef4444]/20' : 'border-[#e2e8f0]'
          }`}
        >
          <span className="text-xs font-semibold text-[#b91c1c]">Rejected</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-[#ef4444] tabular-nums">
              {stats.rejected}
            </span>
            <span className="text-[11px] text-[#64748b]">Slot unavailable</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94a3b8]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by vendor name, business, reference ID, or email..."
              className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm bg-white border border-[#cbd5e1] rounded-lg focus:border-[#d61b22] focus:ring-2 focus:ring-[#d61b22]/15 focus:outline-none"
            />
          </div>

          {/* Status Segmented Buttons */}
          <div className="flex items-center gap-1 p-1 bg-[#f1f5f9] rounded-lg text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-white text-[#0f172a] shadow-xs'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              All ({applications.length})
            </button>
            <button
              onClick={() => setStatusFilter('Pending')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'Pending'
                  ? 'bg-white text-[#b45309] shadow-xs'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <span>Pending</span>
              {stats.pending > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#fef3c7] text-[#b45309] text-[10px] flex items-center justify-center font-bold">
                  {stats.pending}
                </span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter('Approved')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'Approved'
                  ? 'bg-white text-[#047857] shadow-xs'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Approved ({stats.approved})
            </button>
            <button
              onClick={() => setStatusFilter('Rejected')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'Rejected'
                  ? 'bg-white text-[#b91c1c] shadow-xs'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Rejected ({stats.rejected})
            </button>
          </div>

          {/* Category Dropdown Filter */}
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-[#cbd5e1] rounded-lg focus:border-[#d61b22] focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="Food & Beverages (F&B)">Food & Beverages (F&B)</option>
              <option value="Apparel & Fashion">Apparel & Fashion</option>
              <option value="Crafts & Accessories">Crafts & Accessories</option>
              <option value="Services & Lifestyle">Services & Lifestyle</option>
              <option value="Others">Others</option>
            </select>
          </div>
        </div>

        {/* Quick Month Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#f1f5f9] scrollbar-none text-xs">
          <span className="text-[#64748b] text-[11px] font-semibold uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#d61b22]" /> Month:
          </span>
          {['ALL', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) => (
            <button
              key={m}
              onClick={() => setMonthFilter(m)}
              className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors shrink-0 cursor-pointer ${
                monthFilter === m
                  ? 'bg-[#d61b22] text-white font-bold shadow-2xs'
                  : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
              }`}
            >
              {m === 'ALL' ? 'All Months' : m}
            </button>
          ))}
        </div>

        {/* Vendor Category Filter Pills */}
        <div className="flex items-center gap-2 pt-1 text-xs overflow-x-auto scrollbar-none">
          <span className="text-[#64748b] text-[11px] font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-[#d61b22]" /> Vendor Category:
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setVendorCategoryFilter('ALL')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                vendorCategoryFilter === 'ALL'
                  ? 'bg-[#0f172a] text-white font-bold'
                  : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
              }`}
            >
              All Categories
            </button>
            {VENDOR_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setVendorCategoryFilter(cat)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                  vendorCategoryFilter === cat
                    ? 'bg-[#d61b22] text-white font-bold shadow-2xs'
                    : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-[#475569] font-semibold border-b border-[#e2e8f0] uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={filteredApplications.length > 0 && selectedIds.size === filteredApplications.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded text-[#d61b22] border-[#cbd5e1] focus:ring-[#d61b22] cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Ref Code</th>
                <th className="py-3 px-4">Applicant & Business</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Schedule / Month</th>
                <th className="py-3 px-4">Logistics</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#64748b]">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">No vendor applications match current filters.</p>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('ALL');
                          setCategoryFilter('ALL');
                          setMonthFilter('ALL');
                          setVendorCategoryFilter('ALL');
                        }}
                        className="text-xs text-[#d61b22] font-semibold hover:underline cursor-pointer"
                      >
                        Reset filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr
                    key={app.id}
                    className={`hover:bg-[#f8fafc] transition-colors group ${
                      selectedIds.has(app.id) ? 'bg-[#fef2f2]/40' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(app.id)}
                        onChange={() => handleToggleSelect(app.id)}
                        className="w-4 h-4 rounded text-[#d61b22] border-[#cbd5e1] focus:ring-[#d61b22] cursor-pointer"
                      />
                    </td>

                    {/* Ref Code */}
                    <td className="py-3 px-4 font-mono font-semibold text-[#0f172a] whitespace-nowrap">
                      <span className="bg-[#f1f5f9] px-2 py-0.5 rounded border border-[#e2e8f0]">
                        {app.referenceCode}
                      </span>
                    </td>

                    {/* Applicant & Business */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-[#0f172a] flex items-center gap-1.5 flex-wrap">
                          <span>{app.businessName}</span>
                          <span
                            className={`px-1.5 py-0.2 text-[10px] font-bold rounded ${
                              app.vendorCategory === 'Company - Client'
                                ? 'bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]'
                                : app.vendorCategory === 'HR - Vendor'
                                ? 'bg-[#fef3c7] text-[#b45309] border border-[#fde68a]'
                                : app.vendorCategory === 'Kelab Media Prima Berhad'
                                ? 'bg-[#e0e7ff] text-[#4338ca] border border-[#c7d2fe]'
                                : 'bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]'
                            }`}
                          >
                            {app.vendorCategory}
                          </span>
                          {isCrewApp(app) && (
                            <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-[#eff6ff] text-[#1e40af] border border-[#bfdbfe] inline-flex items-center gap-1">
                              <Users className="w-3 h-3 text-[#2563eb]" />
                              <span>Kru #{app.crewIndex || 1} {app.totalCrewInBatch && app.totalCrewInBatch > 1 ? `drpd ${app.totalCrewInBatch}` : ''}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[#64748b] flex items-center gap-1 text-[11px]">
                          <span>{app.applicantName}</span>
                          <span>•</span>
                          <span>{app.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="font-medium text-[#1e293b]">
                          {app.salesItemType}
                        </span>
                        {app.specifiedItemDescription && (
                          <p className="text-[11px] text-[#64748b] line-clamp-1 max-w-[200px]">
                            {app.specifiedItemDescription}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Month */}
                    <td className="py-3 px-4 text-[#475569] whitespace-nowrap">
                      <span className="line-clamp-1 max-w-[180px]" title={app.preferredMonth}>
                        {app.preferredMonth.split('(')[0]}
                      </span>
                    </td>

                    {/* Logistics */}
                    <td className="py-3 px-4 text-[#64748b] whitespace-nowrap">
                      {app.chairQuantity === 'Not Required' ? (
                        <span className="text-xs text-slate-500">1 Table (Staf / Kru)</span>
                      ) : (
                        <span>1 Table · {app.chairQuantity.includes('Chairs') ? app.chairQuantity : `${app.chairQuantity} Chairs`}</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {app.status === 'Approved' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                          Approved
                        </span>
                      )}
                      {app.status === 'Pending' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#fffbeb] text-[#92400e] border border-[#fde68a]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></span>
                          Pending Review
                        </span>
                      )}
                      {app.status === 'Rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></span>
                          Rejected
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedApp(app)}
                          title="View Full Application Dossier"
                          className="p-1.5 rounded hover:bg-[#e2e8f0] text-[#64748b] transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {isCrewApp(app) && app.status === 'Approved' && (
                          <button
                            type="button"
                            onClick={() => setSelectedCrewForPass(app)}
                            title="Lihat Pas Rasmi Kru Acara"
                            className="p-1.5 rounded hover:bg-[#eff6ff] text-[#2563eb] transition-colors cursor-pointer"
                          >
                            <Ticket className="w-4 h-4" />
                          </button>
                        )}

                        {app.status === 'Pending' ? (
                          <>
                            <button
                              onClick={() => handleApprove(app)}
                              className="px-2.5 py-1 rounded-md bg-[#10b981] hover:bg-[#059669] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenReject(app)}
                              className="px-2.5 py-1 rounded-md bg-white border border-[#fca5a5] text-[#dc2626] hover:bg-[#fef2f2] text-xs font-medium transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleResetToPending(app)}
                            title="Reset to Pending for re-evaluation"
                            className="p-1.5 text-xs text-[#64748b] hover:text-[#0f172a] rounded hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        </div>
      )}

      {/* Modal: View Full Details */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-xl border border-[#e2e8f0] space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#e2e8f0] pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-[#d61b22] bg-[#fef2f2] px-2 py-0.5 rounded border border-[#fecaca]">
                  {selectedApp.referenceCode}
                </span>
                <h3 className="text-lg font-bold text-[#0f172a] font-display mt-1">
                  {selectedApp.businessName}
                </h3>
                <p className="text-xs text-[#64748b]">
                  Submitted on {new Date(selectedApp.submittedAt).toLocaleDateString()} at{' '}
                  {new Date(selectedApp.submittedAt).toLocaleTimeString()}
                </p>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="text-[#64748b] hover:text-[#0f172a] p-1.5 rounded-lg hover:bg-[#f1f5f9]"
              >
                ✕
              </button>
            </div>

            {/* Details Content */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#f8fafc] p-3.5 rounded-xl border border-[#e2e8f0]">
                <div>
                  <span className="text-[#64748b] block">Applicant Name</span>
                  <span className="font-semibold text-[#0f172a] text-[13px]">{selectedApp.applicantName}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block">Affiliation</span>
                  <span className="font-semibold text-[#0f172a]">{selectedApp.vendorCategory}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block">Contact Email</span>
                  <span className="font-semibold text-[#0f172a]">{selectedApp.email}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block">Phone Number</span>
                  <span className="font-semibold text-[#0f172a]">{selectedApp.phone}</span>
                </div>
                {(selectedApp.icNumber || selectedApp.staffId) && (
                  <div className="col-span-2 pt-1 border-t border-[#e2e8f0]">
                    <span className="text-[#64748b] block">IC Number (MyKad / NRIC)</span>
                    <span className="font-mono font-semibold text-[#0f172a]">{selectedApp.icNumber || selectedApp.staffId}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <span className="font-bold text-[#0f172a] uppercase tracking-wide text-[11px]">
                  Event Logistics & Requirements
                </span>
                <div className="bg-white border border-[#cbd5e1] p-3 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Preferred Month:</span>
                    <span className="font-semibold text-[#0f172a]">{selectedApp.preferredMonth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Sales Category:</span>
                    <span className="font-semibold text-[#0f172a]">{selectedApp.salesItemType}</span>
                  </div>
                  {selectedApp.specifiedItemDescription && (
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Specified Goods:</span>
                      <span className="font-semibold text-[#0f172a]">{selectedApp.specifiedItemDescription}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Table Allocation:</span>
                    <span className="font-semibold text-[#0f172a]">1 Standard Unit (3' x 3')</span>
                  </div>
                  {selectedApp.chairQuantity && selectedApp.chairQuantity !== 'Not Required' && (
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Chairs:</span>
                      <span className="font-semibold text-[#0f172a]">{selectedApp.chairQuantity}</span>
                    </div>
                  )}
                  {selectedApp.totalCrewInBatch && selectedApp.totalCrewInBatch > 1 && (
                    <div className="flex justify-between items-center pt-1 border-t border-[#f1f5f9]">
                      <span className="text-[#64748b]">Pendaftaran Kru:</span>
                      <span className="font-semibold text-[#1e40af] bg-[#eff6ff] border border-[#bfdbfe] px-2 py-0.5 rounded text-[11px]">
                        Kru #{selectedApp.crewIndex} drpd {selectedApp.totalCrewInBatch} (Batch Bersama)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {selectedApp.additionalNotes && (
                <div className="space-y-1">
                  <span className="font-bold text-[#0f172a] uppercase tracking-wide text-[11px]">
                    Vendor Special Requests / Electrical Notes
                  </span>
                  <p className="bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0] text-[#475569] italic">
                    "{selectedApp.additionalNotes}"
                  </p>
                </div>
              )}

              {/* Status Section */}
              <div className="pt-2 flex items-center justify-between border-t border-[#e2e8f0]">
                <div className="flex items-center gap-2">
                  <span className="text-[#64748b]">Current Status:</span>
                  <span className="font-bold text-sm">
                    {selectedApp.status === 'Approved' && (
                      <span className="text-[#10b981]">Approved</span>
                    )}
                    {selectedApp.status === 'Pending' && (
                      <span className="text-[#d97706]">Pending Review</span>
                    )}
                    {selectedApp.status === 'Rejected' && (
                      <span className="text-[#ef4444]">Rejected</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {selectedApp.status !== 'Approved' && (
                    <button
                      onClick={() => {
                        handleApprove(selectedApp);
                        setSelectedApp(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#10b981] hover:bg-[#059669] text-white text-xs font-semibold shadow-xs"
                    >
                      Approve & Send Email
                    </button>
                  )}
                  {selectedApp.status !== 'Rejected' && (
                    <button
                      onClick={() => {
                        handleOpenReject(selectedApp);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white border border-[#fca5a5] text-[#dc2626] hover:bg-[#fef2f2] text-xs font-semibold"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Rejection Reason */}
      {rejectionModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#e2e8f0] space-y-4">
            <div className="flex items-center gap-2 text-[#dc2626]">
              <AlertTriangle className="w-5 h-5 text-[#dc2626]" />
              <h3 className="font-bold text-base text-[#0f172a]">
                Reject Vendor Application
              </h3>
            </div>
            <p className="text-xs text-[#64748b]">
              Please state the justification for rejecting {rejectionModalApp.businessName} (Ref: {rejectionModalApp.referenceCode}).
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0f172a]">Rejection Reason</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 text-xs border border-[#cbd5e1] rounded-lg focus:border-[#d61b22] focus:outline-none"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectionModalApp(null)}
                className="px-3 py-2 rounded-lg text-xs font-medium text-[#64748b] hover:bg-[#f1f5f9]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-semibold shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Dock */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0f172a] text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#d61b22] text-white flex items-center justify-center font-bold text-xs">
              {selectedIds.size}
            </span>
            <span className="text-xs font-semibold">Applications Selected</span>
          </div>

          <div className="h-4 w-px bg-slate-700"></div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchApprove}
              className="px-3.5 py-1.5 rounded-lg bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Batch Approve ({selectedIds.size})</span>
            </button>

            <button
              onClick={handleBatchReject}
              className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-red-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Batch Reject</span>
            </button>

            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Admin Team & Sesi Reviewers Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#cbd5e1] space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#d61b22]/10 text-[#d61b22] flex items-center justify-center font-bold">
                  <Users className="w-5 h-5 text-[#d61b22]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0f172a] font-display">
                    Pasukan Pegawai HR & Admin Sesi Kelulusan
                  </h3>
                  <p className="text-xs text-[#64748b]">
                    Disimpan dalam Firebase Firestore • Membenarkan sesi semakan bersama rakan sekerja
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAdminModal(false);
                  setAdminFormError(null);
                  setAdminFormSuccess(null);
                }}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* List of Current Admins */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">
                    Pegawai Didaftarkan ({admins.length})
                  </span>
                  {isSuperAdmin ? (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-emerald-600" />
                      Kuasa Super Admin: Boleh Padam Pegawai
                    </span>
                  ) : (
                    <span
                      className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-semibold border border-slate-200 flex items-center gap-1"
                      title="Hanya Super Admin dibenarkan memadam pegawai"
                    >
                      <Lock className="w-3 h-3 text-slate-500" />
                      Hanya Super Admin Boleh Padam Pegawai
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                  Firebase Sync Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                {admins.map((adm) => {
                  const isCurrent = adminUser?.email.toLowerCase() === adm.email.toLowerCase();
                  return (
                    <div
                      key={adm.email}
                      className={`p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                        isCurrent
                          ? 'border-[#d61b22] bg-red-50/20 ring-1 ring-[#d61b22]'
                          : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1]'
                      }`}
                    >
                      <img
                        src={
                          adm.avatar ||
                          'https://api.dicebear.com/7.x/avataaars/svg?seed=' +
                            encodeURIComponent(adm.name)
                        }
                        alt={adm.name}
                        className="w-9 h-9 rounded-full border border-slate-200 shrink-0 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-[#0f172a] truncate">
                            {adm.name}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 bg-[#d61b22] text-white rounded text-[9px] font-bold">
                              Sesi Anda
                            </span>
                          )}
                          {adm.role === 'Super Admin' && !isCurrent && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[9px] font-bold">
                              Super Admin
                            </span>
                          )}
                        </div>
                        <span className="block text-[11px] text-[#475569] font-medium truncate">
                          {adm.role}
                        </span>
                        <span className="block text-[10px] text-[#64748b] truncate">
                          {adm.email}
                        </span>

                        {!isCurrent && (
                          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 flex-wrap">
                            {onSwitchAdmin && (
                              <button
                                type="button"
                                onClick={() => onSwitchAdmin(adm)}
                                className="text-[10.5px] font-bold text-[#d61b22] hover:text-[#b9141a] hover:underline cursor-pointer"
                              >
                                Tukar ke Sesi Ini →
                              </button>
                            )}

                            {/* Delete button: ONLY FOR SUPER ADMIN */}
                            {isSuperAdmin && onDeleteAdmin && (
                              <button
                                type="button"
                                onClick={() => setAdminToDelete(adm)}
                                className="inline-flex items-center gap-1 text-[10.5px] font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-0.5 rounded border border-rose-200 transition-colors ml-auto cursor-pointer"
                                title="Padam admin ini daripada Firebase (Akses Super Admin)"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Padam</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form to Invite / Add New Admin */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#d61b22]" />
                <span className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">
                  Tambah Pegawai / Admin Sesi Baru ke Firebase
                </span>
              </div>

              {adminFormError && (
                <div className="p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-700">
                  {adminFormError}
                </div>
              )}
              {adminFormSuccess && (
                <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
                  {adminFormSuccess}
                </div>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setAdminFormError(null);
                  setAdminFormSuccess(null);
                  if (!newAdminName.trim()) {
                    setAdminFormError('Sila masukkan nama penuh pegawai.');
                    return;
                  }
                  if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
                    setAdminFormError('Sila masukkan alamat emel yang sah.');
                    return;
                  }

                  setIsSubmittingAdmin(true);
                  try {
                    const cleanEmail = newAdminEmail.trim().toLowerCase();
                    const newRecord: AdminUser = {
                      id: `admin-${cleanEmail.replace(/[@.]/g, '_')}`,
                      name: newAdminName.trim(),
                      email: cleanEmail,
                      role: newAdminRole,
                      department: newAdminDept.trim() || 'Group Human Resources',
                      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                        newAdminName.trim()
                      )}`,
                      createdAt: new Date().toISOString(),
                      lastLoginAt: new Date().toISOString(),
                      isOnline: false,
                    };

                    if (onAddAdmin) {
                      await onAddAdmin(newRecord);
                    }
                    setAdminFormSuccess(`Pegawai ${newRecord.name} berjaya disimpan dalam Firebase!`);
                    setNewAdminName('');
                    setNewAdminEmail('');
                  } catch (err: any) {
                    setAdminFormError(err?.message || 'Gagal menyimpan pegawai.');
                  } finally {
                    setIsSubmittingAdmin(false);
                  }
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0f172a] mb-1">
                      Nama Penuh Pegawai
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="contoh: Sarah Tan"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-lg focus:border-[#d61b22] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#0f172a] mb-1">
                      Alamat Emel Rasmi
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="sarah@mediaprima.com.my"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-lg focus:border-[#d61b22] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0f172a] mb-1">
                      Peranan / Jawatan Sesi
                    </label>
                    <select
                      value={newAdminRole}
                      onChange={(e) => setNewAdminRole(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-lg focus:border-[#d61b22] focus:outline-none cursor-pointer"
                    >
                      <option value="Super Admin">Super Admin</option>
                      <option value="HR Committee Reviewer">HR Committee Reviewer</option>
                      <option value="Event Ops Coordinator">Event Ops Coordinator</option>
                      <option value="Safety & Health Reviewer">Safety & Health Reviewer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#0f172a] mb-1">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      placeholder="Group Human Resources"
                      value={newAdminDept}
                      onChange={(e) => setNewAdminDept(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-lg focus:border-[#d61b22] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSubmittingAdmin}
                    className="px-4 py-2 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isSubmittingAdmin ? 'Menyimpan...' : 'Simpan Pegawai ke Firebase'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Delete Admin (Super Admin only) */}
      {adminToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 font-display">
                  Padam Akses Admin
                </h3>
                <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">
                  Tindakan Eksklusif Super Admin
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Adakah anda pasti ingin membuang pegawai ini daripada sistem dan pangkalan data Firebase Firestore? Pegawai ini tidak lagi boleh mengakses sesi semakan dashboard.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="text-xs font-bold text-slate-900">
                {adminToDelete.name}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {adminToDelete.email}
              </div>
              <div className="text-[11px] text-slate-600">
                Peranan: <span className="font-semibold text-slate-800">{adminToDelete.role}</span> • {adminToDelete.department || 'Media Prima'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingAdmin}
                onClick={() => setAdminToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingAdmin}
                onClick={handleConfirmDeleteAdmin}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeletingAdmin ? (
                  <span>Memadam daripada Firebase...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sahkan Padam Akses</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Media Prima Event Crew Pass Modal */}
      {selectedCrewForPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#cbd5e1] overflow-hidden">
            {/* Top Pass Lanyard Slot & Header */}
            <div className="bg-gradient-to-r from-[#d61b22] via-[#b9141a] to-[#1e3a8a] text-white p-5 text-center relative">
              <div className="w-12 h-1.5 rounded-full bg-white/40 mx-auto mb-3"></div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold uppercase tracking-widest text-white mb-2">
                <BadgeCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>Media Prima Berhad • Official Event Crew</span>
              </div>
              <h2 className="text-xl font-bold font-display tracking-wide">
                PAS MASUK KRU ACARA
              </h2>
              <p className="text-xs text-white/80 font-medium">
                Bazar Seloka 2025 • Balai Berita Bangsar
              </p>
            </div>

            {/* Pass Body Content */}
            <div className="p-6 space-y-4">
              <div className="text-center space-y-1">
                <div className="w-16 h-16 rounded-2xl bg-[#eff6ff] border-2 border-[#bfdbfe] text-[#1d4ed8] flex items-center justify-center mx-auto shadow-inner text-xl font-bold">
                  {selectedCrewForPass.applicantName.charAt(0)}
                </div>
                <h3 className="text-base font-bold text-[#0f172a] pt-1">
                  {selectedCrewForPass.applicantName}
                </h3>
                <p className="text-xs text-[#64748b]">
                  IC: <strong className="text-[#0f172a] font-mono">{selectedCrewForPass.icNumber || selectedCrewForPass.staffId}</strong>
                </p>
              </div>

              <div className="bg-[#f8fafc] rounded-xl p-3.5 border border-[#e2e8f0] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Gerai / Tugasan:</span>
                  <span className="font-bold text-[#0f172a] text-right">{selectedCrewForPass.businessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Jabatan Media Prima:</span>
                  <span className="font-semibold text-[#0f172a] text-right">{selectedCrewForPass.department || 'MPB Operations'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Peranan Kru:</span>
                  <span className="font-bold text-[#1d4ed8]">
                    Kru #{selectedCrewForPass.crewIndex || 1} {selectedCrewForPass.totalCrewInBatch ? `drpd ${selectedCrewForPass.totalCrewInBatch}` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Status Kelulusan:</span>
                  <span className="font-bold text-[#059669] flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{selectedCrewForPass.status}</span>
                  </span>
                </div>
              </div>

              {/* Barcode / Reference section */}
              <div className="border border-dashed border-[#cbd5e1] rounded-xl p-3 text-center space-y-1 bg-[#ffffff]">
                <div className="font-mono text-xs font-bold text-[#1e40af] tracking-wider">
                  {selectedCrewForPass.referenceCode}
                </div>
                <div className="h-8 flex items-center justify-center gap-1 text-slate-700">
                  <div className="w-1 h-6 bg-slate-800"></div>
                  <div className="w-2 h-6 bg-slate-800"></div>
                  <div className="w-0.5 h-6 bg-slate-800"></div>
                  <div className="w-1.5 h-6 bg-slate-800"></div>
                  <div className="w-3 h-6 bg-slate-800"></div>
                  <div className="w-1 h-6 bg-slate-800"></div>
                  <div className="w-2 h-6 bg-slate-800"></div>
                  <div className="w-0.5 h-6 bg-slate-800"></div>
                  <div className="w-2.5 h-6 bg-slate-800"></div>
                  <div className="w-1 h-6 bg-slate-800"></div>
                  <div className="w-2 h-6 bg-slate-800"></div>
                </div>
                <p className="text-[10.5px] text-[#64748b]">
                  Pelepasan Masuk: <strong>Pintu 2, Balai Berita Jalan Riong</strong> • Ingress 08:30 AM
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCrewForPass(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#cbd5e1] text-xs font-semibold text-[#334155] hover:bg-[#f8fafc] transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 rounded-xl bg-[#d61b22] hover:bg-[#b9141a] text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Pas Rasmi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
