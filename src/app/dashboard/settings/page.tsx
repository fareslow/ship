"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { FiUser, FiSave, FiKey, FiShield } from "react-icons/fi";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { key: "profile", label: "الملف الشخصي", icon: FiUser },
    { key: "security", label: "الأمان", icon: FiShield },
    { key: "api", label: "مفاتيح API", icon: FiKey },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">الإعدادات</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="card max-w-2xl">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">معلومات الحساب</h3>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">الاسم</label>
                <input
                  type="text"
                  defaultValue={session?.user?.name || ""}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">البريد الإلكتروني</label>
                <input
                  type="email"
                  defaultValue={session?.user?.email || ""}
                  className="input-field"
                  disabled
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">رقم الجوال</label>
                <input type="tel" className="input-field" placeholder="05xxxxxxxx" />
              </div>
              <div>
                <label className="label">اسم الشركة</label>
                <input type="text" className="input-field" placeholder="اسم شركتك" />
              </div>
            </div>
            <button type="button" className="btn-primary flex items-center gap-2">
              <FiSave /> حفظ التغييرات
            </button>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="card max-w-2xl">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">تغيير كلمة المرور</h3>
          <form className="space-y-4">
            <div>
              <label className="label">كلمة المرور الحالية</label>
              <input type="password" className="input-field" />
            </div>
            <div>
              <label className="label">كلمة المرور الجديدة</label>
              <input type="password" className="input-field" minLength={8} />
            </div>
            <div>
              <label className="label">تأكيد كلمة المرور الجديدة</label>
              <input type="password" className="input-field" minLength={8} />
            </div>
            <button type="button" className="btn-primary flex items-center gap-2">
              <FiShield /> تحديث كلمة المرور
            </button>
          </form>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === "api" && (
        <div className="card max-w-2xl">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">مفاتيح API</h3>
          <p className="text-sm text-gray-500 mb-6">
            استخدم مفاتيح API للربط البرمجي مع منصتك أو نظامك الخاص.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">مفتاح API الرئيسي</p>
                <code className="text-xs text-gray-400 mt-1 block">sk_live_••••••••••••••••</code>
              </div>
              <button className="btn-secondary text-sm">نسخ</button>
            </div>
          </div>

          <button className="btn-primary flex items-center gap-2">
            <FiKey /> إنشاء مفتاح جديد
          </button>
        </div>
      )}
    </div>
  );
}
