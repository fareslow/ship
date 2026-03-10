"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiTruck, FiUser, FiMail, FiLock, FiPhone, FiBriefcase } from "react-icons/fi";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    companyName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "حدث خطأ في التسجيل");
        setLoading(false);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("حدث خطأ في الاتصال");
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <FiTruck className="text-primary-600 text-2xl" />
            </div>
            <span className="text-3xl font-bold text-white">ShipPro</span>
          </Link>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">إنشاء حساب جديد</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {typeof error === "string" ? error : "يرجى التحقق من البيانات المدخلة"}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">الاسم الكامل</label>
              <div className="relative">
                <FiUser className="absolute right-3 top-3 text-gray-400" />
                <input type="text" value={form.name} onChange={(e) => updateField("name", e.target.value)} className="input-field pr-10" placeholder="محمد أحمد" required />
              </div>
            </div>

            <div>
              <label className="label">البريد الإلكتروني</label>
              <div className="relative">
                <FiMail className="absolute right-3 top-3 text-gray-400" />
                <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="input-field pr-10" placeholder="example@domain.com" required />
              </div>
            </div>

            <div>
              <label className="label">كلمة المرور</label>
              <div className="relative">
                <FiLock className="absolute right-3 top-3 text-gray-400" />
                <input type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} className="input-field pr-10" placeholder="••••••••" required minLength={8} />
              </div>
            </div>

            <div>
              <label className="label">رقم الجوال</label>
              <div className="relative">
                <FiPhone className="absolute right-3 top-3 text-gray-400" />
                <input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="input-field pr-10" placeholder="05xxxxxxxx" />
              </div>
            </div>

            <div>
              <label className="label">اسم الشركة (اختياري)</label>
              <div className="relative">
                <FiBriefcase className="absolute right-3 top-3 text-gray-400" />
                <input type="text" value={form.companyName} onChange={(e) => updateField("companyName", e.target.value)} className="input-field pr-10" placeholder="اسم شركتك أو متجرك" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "جاري التسجيل..." : "إنشاء الحساب"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="text-primary-600 font-medium hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
