"use client";

import { useEffect, useState } from "react";
import { FiLink, FiCheck, FiExternalLink, FiTrash2 } from "react-icons/fi";

interface IntegrationStatus {
  connected: boolean;
  authUrl?: string;
  store?: {
    id: string;
    name: string;
    domain?: string;
    isActive: boolean;
    createdAt: string;
  };
}

const platforms = [
  {
    key: "zid",
    name: "زد",
    nameEn: "Zid",
    description: "اربط متجرك في زد واستقبل الطلبات تلقائياً",
    color: "from-purple-500 to-purple-700",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
  },
  {
    key: "salla",
    name: "سلة",
    nameEn: "Salla",
    description: "اربط متجرك في سلة وأدر شحناتك بسهولة",
    color: "from-emerald-500 to-emerald-700",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
  },
  {
    key: "shopify",
    name: "شوبيفاي",
    nameEn: "Shopify",
    description: "اربط متجرك في شوبيفاي مع دعم كامل للطلبات",
    color: "from-green-500 to-green-700",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
  },
];

export default function IntegrationsPage() {
  const [statuses, setStatuses] = useState<Record<string, IntegrationStatus>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(
      platforms.map(async (p) => {
        try {
          const res = await fetch(`/api/integrations/${p.key}`);
          const data = await res.json();
          return { key: p.key, data };
        } catch {
          return { key: p.key, data: { connected: false } };
        }
      })
    ).then((results) => {
      const map: Record<string, IntegrationStatus> = {};
      results.forEach((r) => (map[r.key] = r.data));
      setStatuses(map);
      setLoading(false);
    });
  }, []);

  const handleConnect = (key: string) => {
    const status = statuses[key];
    if (status?.authUrl) {
      window.location.href = status.authUrl;
    }
  };

  const handleDisconnect = async (key: string) => {
    if (!confirm("هل أنت متأكد من فصل هذا المتجر؟")) return;

    await fetch(`/api/integrations/${key}`, { method: "DELETE" });
    setStatuses((prev) => ({
      ...prev,
      [key]: { connected: false },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">ربط المتاجر</h1>
        <p className="text-gray-500 mt-1">اربط متجرك الإلكتروني لاستقبال الطلبات وإنشاء الشحنات تلقائياً</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {platforms.map((platform) => {
          const status = statuses[platform.key];
          const isConnected = status?.connected;

          return (
            <div key={platform.key} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
                  <FiLink className="text-white text-2xl" />
                </div>
                {isConnected && (
                  <span className="badge badge-delivered">
                    <FiCheck className="ml-1" /> متصل
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-800">{platform.name}</h3>
              <p className="text-sm text-gray-500 mb-1">{platform.nameEn}</p>
              <p className="text-sm text-gray-400 mb-4">{platform.description}</p>

              {isConnected && status.store ? (
                <div className="space-y-3">
                  <div className={`${platform.bgColor} rounded-lg p-3`}>
                    <p className="text-xs text-gray-500">المتجر المتصل</p>
                    <p className={`font-semibold ${platform.textColor}`}>{status.store.name}</p>
                    {status.store.domain && (
                      <p className="text-xs text-gray-400 mt-1">{status.store.domain}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDisconnect(platform.key)}
                    className="btn-danger w-full text-sm flex items-center justify-center gap-2"
                  >
                    <FiTrash2 /> فصل المتجر
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleConnect(platform.key)}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <FiExternalLink /> ربط المتجر
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Webhook Info */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">إعدادات Webhook</h3>
        <p className="text-sm text-gray-500 mb-4">
          استخدم الروابط التالية لاستقبال الطلبات تلقائياً من متجرك:
        </p>
        <div className="space-y-3">
          {platforms.map((p) => (
            <div key={p.key} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div>
                <p className="text-sm font-medium text-gray-700">{p.name} Webhook</p>
                <code className="text-xs text-gray-400">{`${typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/${p.key}`}</code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
