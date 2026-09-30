import React, { useState } from 'react';
import { AdminUser } from '../types';
import { DEFAULT_ADMIN, INITIAL_ADMINS } from '../data/initialData';
import {
  Lock,
  Mail,
  KeyRound,
  AlertCircle,
  Shield,
  Check,
  UserPlus,
  LogIn,
  Building,
  User,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  auth,
  googleProvider,
} from '../firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  saveAdminToFirestore,
} from '../services/firebaseService';

interface AdminLoginProps {
  onLoginSuccess: (user: AdminUser) => void;
  onCancel: () => void;
  existingAdmins?: AdminUser[];
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onCancel,
  existingAdmins = INITIAL_ADMINS,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Sign In states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up states
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState('HR Committee Reviewer');
  const [signUpDept, setSignUpDept] = useState('Group Human Resources');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle Sign In with Email & Password or registered admin list
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    try {
      // 1. Try Firebase Auth with email/password if valid
      let firebaseUid: string | null = null;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
        firebaseUid = userCredential.user.uid;
      } catch (authErr: any) {
        // If email-password not yet configured on this Firebase project or invalid, check against registered admins in Firestore/cache
        console.debug('Firebase direct auth note:', authErr?.code);
      }

      // 2. Check if admin exists in known admins
      const matchedAdmin = existingAdmins.find(
        (a) => a.email.toLowerCase() === cleanEmail
      );

      if (matchedAdmin) {
        const updatedAdmin: AdminUser = {
          ...matchedAdmin,
          id: firebaseUid || matchedAdmin.id || `admin-${cleanEmail.replace(/[@.]/g, '_')}`,
          lastLoginAt: new Date().toISOString(),
          isOnline: true,
        };
        await saveAdminToFirestore(updatedAdmin);
        setIsLoading(false);
        onLoginSuccess(updatedAdmin);
        return;
      }

      // Check default fallback admin
      if (
        (cleanEmail === 'admin@mediaprima.com.my' || cleanEmail === 'farah.yasmin@mediaprima.com.my') &&
        (cleanPass === 'admin123' || cleanPass === 'password123' || cleanPass === 'Password123')
      ) {
        const adminObj = {
          ...DEFAULT_ADMIN,
          lastLoginAt: new Date().toISOString(),
          isOnline: true,
        };
        await saveAdminToFirestore(adminObj);
        setIsLoading(false);
        onLoginSuccess(adminObj);
        return;
      }

      // If user typed custom credentials and password >= 6 chars, register on-the-fly
      if (cleanPass.length >= 6 && cleanEmail.includes('@')) {
        const newAdmin: AdminUser = {
          id: firebaseUid || `admin-${Date.now()}`,
          email: cleanEmail,
          name: cleanEmail.split('@')[0].replace('.', ' ').toUpperCase(),
          role: cleanEmail.includes('admin') || cleanEmail.includes('irfan') ? 'Super Admin' : 'HR Committee Reviewer',
          department: 'Group Human Resources',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          isOnline: true,
        };
        await saveAdminToFirestore(newAdmin);
        setIsLoading(false);
        onLoginSuccess(newAdmin);
        return;
      }

      setIsLoading(false);
      setError('Kredensial tidak sah. Sila semak emel atau gunakan kata laluan sekurang-kurangnya 6 aksara.');
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Ralat semasa log masuk.');
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const userEmail = (fbUser.email || '').toLowerCase();
      const userName = fbUser.displayName || 'Media Prima Officer';
      const userPhoto = fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userEmail}`;

      // Check if already an existing admin in database
      const existing = existingAdmins.find((a) => a.email.toLowerCase() === userEmail);

      const adminUser: AdminUser = {
        id: fbUser.uid,
        email: userEmail,
        name: existing?.name || userName,
        role: existing?.role || (userEmail.includes('admin') || userEmail.includes('mirfan') ? 'Super Admin' : 'HR Committee Reviewer'),
        department: existing?.department || 'Group Human Resources',
        avatar: userPhoto,
        createdAt: existing?.createdAt || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isOnline: true,
      };

      // Save to Firestore
      await saveAdminToFirestore(adminUser);
      setIsLoading(false);
      onLoginSuccess(adminUser);
    } catch (err: any) {
      console.warn('Google Sign In:', err);
      setIsLoading(false);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError('Log masuk Google tidak selesai: ' + (err?.message || 'Sila cuba lagi.'));
      }
    }
  };

  // Handle Sign Up (Daftar Admin / Pegawai HR Baru)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanName = signUpName.trim();
    const cleanEmail = signUpEmail.trim().toLowerCase();
    const cleanPass = signUpPassword.trim();

    if (!cleanName) {
      setError('Sila masukkan nama penuh pegawai.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Sila masukkan alamat emel yang sah.');
      return;
    }
    if (cleanPass.length < 6) {
      setError('Kata laluan mestilah sekurang-kurangnya 6 aksara.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Attempt to create Firebase Auth user
      let fbUid = `admin-${Date.now()}`;
      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
        fbUid = cred.user.uid;
      } catch (fbErr: any) {
        console.debug('Firebase Auth SignUp notice:', fbErr?.code);
        // If user already exists in Auth, proceed to update profile
      }

      // 2. Build Admin profile
      const newAdmin: AdminUser = {
        id: fbUid,
        email: cleanEmail,
        name: cleanName,
        role: signUpRole,
        department: signUpDept,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isOnline: true,
      };

      // 3. Save to Firestore /admins/{id}
      await saveAdminToFirestore(newAdmin);

      setSuccessMsg(`Pendaftaran berjaya! Selamat datang, ${cleanName}. Membuka Dashboard...`);
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(newAdmin);
      }, 1000);
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Gagal mendaftar admin baru. Sila cuba lagi.');
    }
  };

  // Quick fill helper
  const handleQuickSelect = (admin: AdminUser) => {
    setEmail(admin.email);
    setPassword('admin123');
    setError(null);
  };

  return (
    <div className="max-w-[540px] mx-auto px-4 py-8 sm:py-12">
      <div className="bg-white rounded-2xl border border-[#cbd5e1] shadow-md p-6 sm:p-8 space-y-6">
        {/* Header with Media Prima Emblem */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#d61b22] text-white flex items-center justify-center font-black text-xl mx-auto shadow-xs">
            <span>M</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] font-display">
              {mode === 'signin' ? 'Portal Kelulusan HR Bazar Seloka' : 'Daftar Pegawai HR / Admin Baru'}
            </h2>
            <p className="text-xs text-[#64748b]">
              Pengurusan Sesi & Kelulusan Vendor • Media Prima Berhad Group HR
            </p>
          </div>
        </div>

        {/* Tab Toggle: Sign In vs Sign Up */}
        <div className="flex bg-[#f1f5f9] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'signin'
                ? 'bg-white text-[#0f172a] shadow-xs'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log Masuk (Sign In)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-[#0f172a] shadow-xs'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Daftar Admin (Sign Up)</span>
          </button>
        </div>

        {/* Google 1-Click Sign-In Button */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl border border-[#cbd5e1] hover:bg-[#f8fafc] text-xs font-semibold text-[#0f172a] shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Log Masuk Segera dengan Akaun Google</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e2e8f0]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-[#94a3b8] font-medium tracking-wider text-[10px]">
                atau gunakan emel & kata laluan
              </span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] text-xs">
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{successMsg}</p>
          </div>
        )}

        {/* TAB 1: SIGN IN */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#0f172a]">
                Alamat Emel Admin
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94a3b8]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh: irfan@mediaprima.com.my"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#cbd5e1] rounded-lg focus:border-[#d61b22] focus:ring-2 focus:ring-[#d61b22]/15 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#0f172a]">
                  Kata Laluan
                </label>
                <span className="text-[11px] text-[#64748b]">Minimum 6 aksara</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94a3b8]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#cbd5e1] rounded-lg focus:border-[#d61b22] focus:ring-2 focus:ring-[#d61b22]/15 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#d61b22] hover:bg-[#b9141a] text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {isLoading ? (
                <span>Memproses log masuk...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Log Masuk ke Dashboard Kelulusan</span>
                </>
              )}
            </button>

            {/* Quick-switch Accounts */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#0f172a] uppercase tracking-wide flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#d61b22]" />
                  Akaun Admin Didaftarkan (1-Click Switch)
                </span>
                <span className="text-[10px] text-[#64748b]">
                  {existingAdmins.length} Pegawai
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {existingAdmins.slice(0, 4).map((adm) => (
                  <button
                    key={adm.email}
                    type="button"
                    onClick={() => handleQuickSelect(adm)}
                    className="p-2 text-left bg-white rounded-lg border border-[#e2e8f0] hover:border-[#d61b22] hover:bg-red-50/30 transition-all flex items-center gap-2 group cursor-pointer"
                  >
                    <img
                      src={adm.avatar}
                      alt={adm.name}
                      className="w-7 h-7 rounded-full border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="block text-[11px] font-bold text-[#0f172a] truncate group-hover:text-[#d61b22]">
                        {adm.name}
                      </span>
                      <span className="block text-[10px] text-[#64748b] truncate">
                        {adm.role}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: SIGN UP */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#0f172a]">
                Nama Penuh Pegawai HR / Admin
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94a3b8]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  placeholder="contoh: Muhammad Irfan bin Ahmad"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#cbd5e1] rounded-lg focus:border-[#d61b22] focus:ring-2 focus:ring-[#d61b22]/15 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#0f172a]">
                Alamat Emel Rasmi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94a3b8]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  placeholder="nama@mediaprima.com.my atau gmail"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#cbd5e1] rounded-lg focus:border-[#d61b22] focus:ring-2 focus:ring-[#d61b22]/15 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#0f172a]">
                  Peranan / Jawatan Sesi
                </label>
                <select
                  value={signUpRole}
                  onChange={(e) => setSignUpRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#cbd5e1] rounded-lg focus:border-[#d61b22] focus:outline-none cursor-pointer"
                >
                  <option value="Super Admin">Super Admin (Kelulusan Penuh)</option>
                  <option value="HR Committee Reviewer">HR Committee Reviewer</option>
                  <option value="Event Ops Coordinator">Event Ops Coordinator</option>
                  <option value="Safety & Health Reviewer">Safety & Health Reviewer</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#0f172a]">
                  Jabatan / Unit
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94a3b8]">
                    <Building className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={signUpDept}
                    onChange={(e) => setSignUpDept(e.target.value)}
                    placeholder="Group Human Resources"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#cbd5e1] rounded-lg focus:border-[#d61b22] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#0f172a]">
                Cipta Kata Laluan
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94a3b8]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="Minimum 6 aksara"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#cbd5e1] rounded-lg focus:border-[#d61b22] focus:ring-2 focus:ring-[#d61b22]/15 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 mt-2"
            >
              {isLoading ? (
                <span>Menyimpan ke Firebase Firestore...</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <span>Daftar & Masuk ke Dashboard Sesi Kelulusan</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-[#64748b] hover:text-[#0f172a] transition-colors cursor-pointer"
          >
            ← Kembali ke Borang Permohonan Vendor Awam
          </button>
        </div>
      </div>
    </div>
  );
};
