"use client";

import { useEffect, useState } from "react";
import { FiFileText, FiShoppingCart } from "react-icons/fi";

interface Waybill {
  id: string;
  number: string;
  status: string;
  assignedAt: string;
  usedAt: string;
  createdAt: string;
  batch: {
    id: string;
    sellPrice: number;
    carrier: { name: string; nameAr: string; code: string };
  };
}

const statusLabels: Record<string, string> = {
  AVAILABLE: "متاح",
  RESERVED: "محجوز",
  USED: "مستخدم",
  EXPIRED: "منتهي",
  CANCELLED: "ملغي",
};

const statusColors: Record<string, string> = {
  AVAILABLE: "badge-delivered",
  RESERVED: "badge-transit",
  USED: "badge-pending",
  EXPIRED: "badge-failed",
  CANCELLED: "badge-cancelled",
};

export default function WaybillsPage() {
  const [waybills, setWaybills] = useState<Waybill[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/waybills?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setWaybills(data.waybills || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">البوليصات</h1>
        <button className="btn-primary flex items-center gap-2">
          <FiShoppingCart /> شراء بوليصات
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setStatusFilter("")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${!statusFilter ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-600"}`}
        >
          الكل
        </button>
        {Object.entries(statusLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${statusFilter === key ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-600"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        {waybills.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <FiFileText className="text-4xl mx-auto mb-3" />
            <p>لا توجد بوليصات</p>
            <p className="text-sm mt-1">اشترِ بوليصات مخفضة لشحناتك</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">رقم البوليصة</th>
                <th className="table-header">شركة الشحن</th>
                <th className="table-header">السعر</th>
                <th className="table-header">الحالة</th>
                <th className="table-header">تاريخ الحجز</th>
                <th className="table-header">تاريخ الاستخدام</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {waybills.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="table-cell font-mono text-xs">{w.number}</td>
                  <td className="table-cell">{w.batch?.carrier?.nameAr || w.batch?.carrier?.name}</td>
                  <td className="table-cell font-medium">{w.batch?.sellPrice?.toFixed(2)} ر.س</td>
                  <td className="table-cell">
                    <span className={`badge ${statusColors[w.status] || "badge-pending"}`}>
                      {statusLabels[w.status] || w.status}
                    </span>
                  </td>
                  <td className="table-cell text-xs text-gray-400">
                    {w.assignedAt ? new Date(w.assignedAt).toLocaleDateString("ar-SA") : "-"}
                  </td>
                  <td className="table-cell text-xs text-gray-400">
                    {w.usedAt ? new Date(w.usedAt).toLocaleDateString("ar-SA") : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
