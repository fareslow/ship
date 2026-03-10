"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiX,
  FiExternalLink,
  FiPrinter,
} from "react-icons/fi";

interface Shipment {
  id: string;
  trackingNumber: string;
  status: string;
  senderName: string;
  senderCity: string;
  receiverName: string;
  receiverPhone: string;
  receiverCity: string;
  receiverAddress: string;
  weight: number;
  pieces: number;
  codAmount: number;
  price: number;
  description: string;
  labelUrl: string;
  createdAt: string;
  carrier: { id: string; name: string; nameAr: string; code: string };
}

interface Carrier {
  id: string;
  name: string;
  nameAr: string;
  code: string;
}

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

export default function ShipmentsPage() {
  const searchParams = useSearchParams();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(searchParams.get("new") === "true");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  const [form, setForm] = useState({
    carrierId: "",
    senderName: "",
    senderPhone: "",
    senderCity: "",
    senderAddress: "",
    receiverName: "",
    receiverPhone: "",
    receiverCity: "",
    receiverAddress: "",
    weight: 1,
    pieces: 1,
    codAmount: 0,
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchShipments();
    fetchCarriers();
  }, [search, statusFilter, pagination.page]);

  const fetchShipments = async () => {
    const params = new URLSearchParams();
    params.set("page", String(pagination.page));
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);

    const res = await fetch(`/api/shipments?${params}`);
    const data = await res.json();
    setShipments(data.shipments || []);
    setPagination((prev) => ({ ...prev, total: data.pagination?.total || 0, totalPages: data.pagination?.totalPages || 0 }));
    setLoading(false);
  };

  const fetchCarriers = async () => {
    const res = await fetch("/api/carriers");
    const data = await res.json();
    setCarriers(data.carriers || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          weight: Number(form.weight),
          pieces: Number(form.pieces),
          codAmount: Number(form.codAmount),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "حدث خطأ في إنشاء الشحنة");
        setSubmitting(false);
        return;
      }

      setShowNewForm(false);
      setForm({
        carrierId: "",
        senderName: "",
        senderPhone: "",
        senderCity: "",
        senderAddress: "",
        receiverName: "",
        receiverPhone: "",
        receiverCity: "",
        receiverAddress: "",
        weight: 1,
        pieces: 1,
        codAmount: 0,
        description: "",
      });
      fetchShipments();
    } catch {
      setFormError("حدث خطأ في الاتصال");
    }
    setSubmitting(false);
  };

  const updateField = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">الشحنات</h1>
        <button onClick={() => setShowNewForm(true)} className="btn-primary flex items-center gap-2">
          <FiPlus /> شحنة جديدة
        </button>
      </div>

      {/* New Shipment Modal */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">إنشاء شحنة جديدة</h2>
              <button onClick={() => setShowNewForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {typeof formError === "string" ? formError : "يرجى التحقق من البيانات"}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Carrier Selection */}
              <div>
                <label className="label">شركة الشحن</label>
                <select value={form.carrierId} onChange={(e) => updateField("carrierId", e.target.value)} className="input-field" required>
                  <option value="">اختر شركة الشحن</option>
                  {carriers.map((c) => (
                    <option key={c.id} value={c.id}>{c.nameAr || c.name}</option>
                  ))}
                </select>
              </div>

              {/* Sender Info */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">بيانات المرسل</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">الاسم</label>
                    <input type="text" value={form.senderName} onChange={(e) => updateField("senderName", e.target.value)} className="input-field" required />
                  </div>
                  <div>
                    <label className="label">الجوال</label>
                    <input type="tel" value={form.senderPhone} onChange={(e) => updateField("senderPhone", e.target.value)} className="input-field" required />
                  </div>
                  <div>
                    <label className="label">المدينة</label>
                    <input type="text" value={form.senderCity} onChange={(e) => updateField("senderCity", e.target.value)} className="input-field" required />
                  </div>
                  <div>
                    <label className="label">العنوان</label>
                    <input type="text" value={form.senderAddress} onChange={(e) => updateField("senderAddress", e.target.value)} className="input-field" required />
                  </div>
                </div>
              </div>

              {/* Receiver Info */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">بيانات المستلم</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">الاسم</label>
                    <input type="text" value={form.receiverName} onChange={(e) => updateField("receiverName", e.target.value)} className="input-field" required />
                  </div>
                  <div>
                    <label className="label">الجوال</label>
                    <input type="tel" value={form.receiverPhone} onChange={(e) => updateField("receiverPhone", e.target.value)} className="input-field" required />
                  </div>
                  <div>
                    <label className="label">المدينة</label>
                    <input type="text" value={form.receiverCity} onChange={(e) => updateField("receiverCity", e.target.value)} className="input-field" required />
                  </div>
                  <div>
                    <label className="label">العنوان</label>
                    <input type="text" value={form.receiverAddress} onChange={(e) => updateField("receiverAddress", e.target.value)} className="input-field" required />
                  </div>
                </div>
              </div>

              {/* Package Info */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">بيانات الطرد</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="label">الوزن (كجم)</label>
                    <input type="number" value={form.weight} onChange={(e) => updateField("weight", e.target.value)} className="input-field" min="0.1" step="0.1" required />
                  </div>
                  <div>
                    <label className="label">القطع</label>
                    <input type="number" value={form.pieces} onChange={(e) => updateField("pieces", e.target.value)} className="input-field" min="1" required />
                  </div>
                  <div>
                    <label className="label">الدفع عند الاستلام</label>
                    <input type="number" value={form.codAmount} onChange={(e) => updateField("codAmount", e.target.value)} className="input-field" min="0" />
                  </div>
                  <div>
                    <label className="label">الوصف</label>
                    <input type="text" value={form.description} onChange={(e) => updateField("description", e.target.value)} className="input-field" placeholder="وصف الطرد" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? "جاري الإنشاء..." : "إنشاء الشحنة"}
                </button>
                <button type="button" onClick={() => setShowNewForm(false)} className="btn-secondary">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <FiSearch className="absolute right-3 top-3 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث برقم التتبع أو اسم المستلم..."
            className="input-field pr-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-auto">
            <option value="">جميع الحالات</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="text-center py-10">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : shipments.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p>لا توجد شحنات</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">رقم التتبع</th>
                <th className="table-header">المستلم</th>
                <th className="table-header">من / إلى</th>
                <th className="table-header">شركة الشحن</th>
                <th className="table-header">المبلغ</th>
                <th className="table-header">الحالة</th>
                <th className="table-header">التاريخ</th>
                <th className="table-header">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {shipments.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="table-cell font-mono text-xs">{s.trackingNumber || "-"}</td>
                  <td className="table-cell">
                    <div>{s.receiverName}</div>
                    <div className="text-xs text-gray-400">{s.receiverPhone}</div>
                  </td>
                  <td className="table-cell text-xs">
                    {s.senderCity} → {s.receiverCity}
                  </td>
                  <td className="table-cell">{s.carrier?.nameAr || s.carrier?.name}</td>
                  <td className="table-cell">
                    <div>{s.price?.toFixed(2)} ر.س</div>
                    {s.codAmount > 0 && <div className="text-xs text-orange-500">COD: {s.codAmount} ر.س</div>}
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${statusBadge[s.status] || "badge-pending"}`}>
                      {statusLabels[s.status] || s.status}
                    </span>
                  </td>
                  <td className="table-cell text-xs text-gray-400">
                    {new Date(s.createdAt).toLocaleDateString("ar-SA")}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      {s.trackingNumber && (
                        <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-primary-600" title="تتبع">
                          <FiExternalLink className="text-sm" />
                        </button>
                      )}
                      {s.labelUrl && (
                        <a href={s.labelUrl} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-primary-600" title="طباعة">
                          <FiPrinter className="text-sm" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              إجمالي {pagination.total} شحنة
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page <= 1}
                className="btn-secondary text-sm !px-3 !py-1.5"
              >
                السابق
              </button>
              <span className="text-sm text-gray-500 flex items-center px-3">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="btn-secondary text-sm !px-3 !py-1.5"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
