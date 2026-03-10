"use client";

import { useSession } from "next-auth/react";
import { FiBell, FiUser } from "react-icons/fi";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          مرحباً، {session?.user?.name || "مستخدم"}
        </h2>
        <p className="text-sm text-gray-500">إدارة شحناتك ومتاجرك</p>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <FiBell className="text-xl" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <FiUser className="text-primary-600 text-sm" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">{session?.user?.name}</p>
            <p className="text-xs text-gray-400">{session?.user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
