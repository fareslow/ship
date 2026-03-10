"use client";

import { useEffect, useState } from "react";
import { FiShoppingBag, FiSend } from "react-icons/fi";

interface Order {
  id: string;
  platformOrderId: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  store: { name: string; platform: string };
  shipments: Array<{
    id: string;
    trackingNumber: string;
    status: string;
    carrier: { name: string; nameAr: string };
  }>;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  useEffect(() => {
    fetch(`/api/orders?page=${pagination.page}`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.orders || []);
        setPagination((prev) => ({ ...prev, total: data.pagination?.total || 0, totalPages: data.pagination?.totalPages || 0 }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pagination.page]);

  const platformLabels: Record<string, string> = {
    ZID: "زد",
    SALLA: "سلة",
    SHOPIFY: "شوبيفاي",
    MANUAL: "يدوي",
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
      <h1 className="text-2xl font-bold text-gray-800">الطلبات</h1>

      <div className="card overflow-x-auto">
        {orders.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <FiShoppingBag className="text-4xl mx-auto mb-3" />
            <p>لا توجد طلبات</p>
            <p className="text-sm mt-1">اربط متجرك لاستقبال الطلبات تلقائياً</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">رقم الطلب</th>
                <th className="table-header">العميل</th>
                <th className="table-header">المنصة</th>
                <th className="table-header">المبلغ</th>
                <th className="table-header">الحالة</th>
                <th className="table-header">الشحنة</th>
                <th className="table-header">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="table-cell font-mono text-xs">#{order.platformOrderId || order.id.slice(0, 8)}</td>
                  <td className="table-cell">
                    <div>{order.customerName}</div>
                    <div className="text-xs text-gray-400">{order.customerPhone}</div>
                  </td>
                  <td className="table-cell">
                    <span className="badge bg-gray-100 text-gray-700">
                      {platformLabels[order.store?.platform] || order.store?.platform}
                    </span>
                  </td>
                  <td className="table-cell font-medium">{order.totalAmount} {order.currency}</td>
                  <td className="table-cell">
                    <span className="badge badge-pending">{order.status}</span>
                  </td>
                  <td className="table-cell">
                    {order.shipments.length > 0 ? (
                      <div className="flex items-center gap-1 text-xs">
                        <FiSend className="text-primary-500" />
                        <span>{order.shipments[0].carrier?.nameAr}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">بدون شحنة</span>
                    )}
                  </td>
                  <td className="table-cell text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString("ar-SA")}
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
