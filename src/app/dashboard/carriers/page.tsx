"use client";

import { useEffect, useState } from "react";
import { FiTruck, FiCheckCircle, FiPackage } from "react-icons/fi";

interface Carrier {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  isActive: boolean;
  basePrice: number;
  discountPct: number;
  _count: { shipments: number };
}

export default function CarriersPage() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/carriers")
      .then((res) => res.json())
      .then((data) => {
        setCarriers(data.carriers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const carrierColors: Record<string, string> = {
    SMSA: "from-blue-500 to-blue-700",
    ARAMEX: "from-red-500 to-red-700",
    DHL: "from-yellow-500 to-yellow-700",
    SPL: "from-green-500 to-green-700",
    FETCHR: "from-purple-500 to-purple-700",
    JANDT: "from-indigo-500 to-indigo-700",
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
      <h1 className="text-2xl font-bold text-gray-800">شركات الشحن</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {carriers.map((carrier) => (
          <div key={carrier.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${carrierColors[carrier.code] || "from-gray-500 to-gray-700"} flex items-center justify-center`}>
                <FiTruck className="text-white text-2xl" />
              </div>
              {carrier.isActive && (
                <span className="badge badge-delivered">
                  <FiCheckCircle className="ml-1" /> مفعّل
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-gray-800">{carrier.nameAr}</h3>
            <p className="text-sm text-gray-500 mb-4">{carrier.name}</p>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">السعر الأساسي</p>
                <p className="font-semibold text-gray-700">{carrier.basePrice} ر.س</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">نسبة الخصم</p>
                <p className="font-semibold text-green-600">{carrier.discountPct}%</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-400">عدد الشحنات</p>
                <p className="font-semibold text-gray-700 flex items-center gap-1">
                  <FiPackage className="text-sm" /> {carrier._count.shipments}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {carriers.length === 0 && (
        <div className="card text-center py-10 text-gray-400">
          <FiTruck className="text-4xl mx-auto mb-3" />
          <p>لا توجد شركات شحن مسجلة</p>
        </div>
      )}
    </div>
  );
}
