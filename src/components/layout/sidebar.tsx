"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  FiTruck,
  FiHome,
  FiPackage,
  FiSend,
  FiLink,
  FiFileText,
  FiSettings,
  FiLogOut,
  FiShoppingBag,
} from "react-icons/fi";

const menuItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: FiHome },
  { href: "/dashboard/shipments", label: "الشحنات", icon: FiSend },
  { href: "/dashboard/orders", label: "الطلبات", icon: FiShoppingBag },
  { href: "/dashboard/carriers", label: "شركات الشحن", icon: FiTruck },
  { href: "/dashboard/waybills", label: "البوليصات", icon: FiFileText },
  { href: "/dashboard/integrations", label: "ربط المتاجر", icon: FiLink },
  { href: "/dashboard/settings", label: "الإعدادات", icon: FiSettings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-l border-gray-100 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <FiPackage className="text-white text-lg" />
          </div>
          <span className="text-xl font-bold text-gray-800">ShipPro</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? "sidebar-link-active" : "sidebar-link"}
            >
              <Icon className="text-lg" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-700"
        >
          <FiLogOut className="text-lg" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
