"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { FiTruck, FiPackage, FiBarChart2, FiLink, FiArrowLeft } from "react-icons/fi";

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900">
      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <FiTruck className="text-primary-600 text-xl" />
          </div>
          <span className="text-2xl font-bold text-white">ShipPro</span>
        </div>
        <div className="flex items-center gap-4">
          {session ? (
            <Link href="/dashboard" className="btn-primary bg-white !text-primary-700 hover:!bg-gray-100">
              لوحة التحكم
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-white hover:text-gray-200 font-medium">
                تسجيل الدخول
              </Link>
              <Link href="/register" className="btn-primary bg-white !text-primary-700 hover:!bg-gray-100">
                إنشاء حساب
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          منصة إدارة الشحنات
          <br />
          <span className="text-primary-300">للمتاجر الإلكترونية</span>
        </h1>
        <p className="text-xl text-primary-200 max-w-2xl mx-auto mb-10">
          أدِر شحناتك بذكاء مع أفضل شركات الشحن. بوليصات مخفضة، ربط مباشر مع متجرك، وتتبع لحظي لجميع شحناتك.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register" className="btn-primary bg-white !text-primary-700 hover:!bg-gray-100 !px-8 !py-3 text-lg flex items-center gap-2">
            ابدأ الآن مجاناً
            <FiArrowLeft />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<FiTruck className="text-3xl" />}
            title="شركات شحن متعددة"
            description="سمسا، أرامكس، DHL، البريد السعودي وغيرها. كلها في مكان واحد."
          />
          <FeatureCard
            icon={<FiPackage className="text-3xl" />}
            title="بوليصات مخفضة"
            description="احصل على أسعار شحن مخفضة تصل إلى 50% مع بوليصات جاهزة."
          />
          <FeatureCard
            icon={<FiLink className="text-3xl" />}
            title="ربط المتاجر"
            description="اربط متجرك في زد، سلة، أو شوبيفاي واستقبل الطلبات تلقائياً."
          />
          <FeatureCard
            icon={<FiBarChart2 className="text-3xl" />}
            title="تقارير ذكية"
            description="تابع أداء شحناتك وأرباحك مع تقارير تفصيلية ولحظية."
          />
        </div>
      </section>

      {/* Carriers Section */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-10">شركاؤنا في الشحن</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {["SMSA Express", "Aramex", "DHL Express", "البريد السعودي SPL"].map((name) => (
            <div key={name} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-white rounded-full mx-auto mb-3 flex items-center justify-center">
                <FiTruck className="text-primary-600 text-2xl" />
              </div>
              <p className="text-white font-medium">{name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Platforms Section */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-10">المنصات المدعومة</h2>
        <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
          {["زد Zid", "سلة Salla", "Shopify"].map((name) => (
            <div key={name} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <p className="text-white font-medium">{name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-10 border-t border-white/10">
        <div className="text-center text-primary-300">
          <p>&copy; 2024 ShipPro. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-right">
      <div className="text-primary-300 mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-primary-200 text-sm">{description}</p>
    </div>
  );
}
