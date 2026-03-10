"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiSend,
  FiClock,
  FiTruck,
  FiCheckCircle,
  FiDollarSign,
  FiTrendingUp,
  FiShoppingBag,
  FiFileText,
  FiPlus,
} from "react-icons/fi";

interface Stats {
  totalShipments: number;
  pendingShipments: number;
  inTransitShipments: number;
  deliveredShipments: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  activeStores: number;
  availableWaybills: number;
}

interface RecentShipment {
  id: string;
  trackingNumber: string;
  receiverName: string;
  receiverCity: string;
  status: string;
  createdAt: string;
  carrier: { name: string; nameAr: string };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentShipments, setRecentShipments] = useState<RecentShipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setRecentShipments(data.recentShipments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statusLabels: Record<string, string> = {
    PENDING: "قيد الانتظار",
    PICKED_UP: "تم الاستلام",
    IN_TRANSIT: "في الطريق",
    OUT_FOR_DELIVERY: "جاري التوصيل",
    DELIVERED: "تم التسليم",
    RETURNED: "مرتجع",
    CANCELLED: "ملغي",
    FAILED: "فشل",
  };

  const statusBadge: Record<string, string> = {
    PENDING: "badge-pending",
    PICKED_UP: "badge-transit",
    IN_TRANSIT: "badge-transit",
    OUT_FOR_DELIVERY: "badge-transit",
    DELIVERED: "badge-delivered",
    RETURNED: "badge-cancelled",
    CANCELLED: "badge-cancelled",
    FAILED: "badge-failed",
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
        <Link href="/dashboard/shipments?new=true" className="btn-primary flex items-center gap-2">
          <FiPlus />
          شحنة جديدة
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<FiSend />} label="إجمالي الشحنات" value={stats?.totalShipments || 0} color="blue" />
        <StatCard icon={<FiClock />} label="قيد الانتظار" value={stats?.pendingShipments || 0} color="yellow" />
        <StatCard icon={<FiTruck />} label="في الطريق" value={stats?.inTransitShipments || 0} color="indigo" />
        <StatCard icon={<FiCheckCircle />} label="تم التسليم" value={stats?.deliveredShipments || 0} color="green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<FiDollarSign />} label="إجمالي الإيرادات" value={`${(stats?.totalRevenue || 0).toFixed(2)} ر.س`} color="emerald" />
        <StatCard icon={<FiTrendingUp />} label="الأرباح" value={`${(stats?.profit || 0).toFixed(2)} ر.س`} color="teal" />
        <StatCard icon={<FiFileText />} label="بوليصات متاحة" value={stats?.availableWaybills || 0} color="purple" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/dashboard/shipments?new=true" className="card hover:shadow-md transition-shadow flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <FiPlus className="text-primary-600" />
          </div>
          <span className="font-medium text-gray-700">إنشاء شحنة</span>
        </Link>
        <Link href="/dashboard/orders" className="card hover:shadow-md transition-shadow flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <FiShoppingBag className="text-orange-600" />
          </div>
          <span className="font-medium text-gray-700">عرض الطلبات</span>
        </Link>
        <Link href="/dashboard/waybills" className="card hover:shadow-md transition-shadow flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <FiFileText className="text-purple-600" />
          </div>
          <span className="font-medium text-gray-700">شراء بوليصات</span>
        </Link>
        <Link href="/dashboard/integrations" className="card hover:shadow-md transition-shadow flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <FiShoppingBag className="text-green-600" />
          </div>
          <span className="font-medium text-gray-700">ربط متجر</span>
        </Link>
      </div>

      {/* Recent Shipments */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">آخر الشحنات</h3>
          <Link href="/dashboard/shipments" className="text-primary-600 text-sm font-medium hover:underline">
            عرض الكل
          </Link>
        </div>

        {recentShipments.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <FiSend className="text-4xl mx-auto mb-3" />
            <p>لا توجد شحنات بعد</p>
            <Link href="/dashboard/shipments?new=true" className="text-primary-600 text-sm font-medium hover:underline mt-2 inline-block">
              إنشاء أول شحنة
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">رقم التتبع</th>
                  <th className="table-header">المستلم</th>
                  <th className="table-header">المدينة</th>
                  <th className="table-header">شركة الشحن</th>
                  <th className="table-header">الحالة</th>
                  <th className="table-header">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentShipments.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="table-cell font-mono text-xs">{s.trackingNumber || "-"}</td>
                    <td className="table-cell">{s.receiverName}</td>
                    <td className="table-cell">{s.receiverCity}</td>
                    <td className="table-cell">{s.carrier?.nameAr || s.carrier?.name}</td>
                    <td className="table-cell">
                      <span className={`badge ${statusBadge[s.status] || "badge-pending"}`}>
                        {statusLabels[s.status] || s.status}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-gray-400">
                      {new Date(s.createdAt).toLocaleDateString("ar-SA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    yellow: "bg-yellow-100 text-yellow-600",
    indigo: "bg-indigo-100 text-indigo-600",
    green: "bg-green-100 text-green-600",
    emerald: "bg-emerald-100 text-emerald-600",
    teal: "bg-teal-100 text-teal-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="stat-card">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${colorMap[color] || colorMap.blue}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}
