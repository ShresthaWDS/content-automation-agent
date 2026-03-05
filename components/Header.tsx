"use client";

import { Menu,Search } from "lucide-react";
import { useState } from "react";
import UserDropdown from "./UserDropdown";
import logo from "@/public/logo.png";

type HeaderUser = {
  name: string;
  email: string;
  username?: string;
};

type HeaderProps = {
  query?: string;
  onQueryChange?: (value: string) => void;
  user?: HeaderUser | null;
  isHistoryOpen?: boolean;
  onToggleHistory?: () => void;
};

export default function Header({
  query,
  onQueryChange,
  user,
  onToggleHistory,
}: HeaderProps) {
  const [localQuery, setLocalQuery] = useState("");
  const searchValue = query ?? localQuery;

  const handleSearchChange = (value: string) => {
    if (onQueryChange) {
      onQueryChange(value);
      return;
    }

    setLocalQuery(value);
  };

  return (
    <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      {/* Left - Logo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleHistory}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-black bg-black text-white transition hover:bg-slate-800"
          aria-label="Toggle history panel"
        >
          <Menu className="h-4 w-4" />
        </button>
        <img className="h-10" src={logo.src} alt="WDS" />
      </div>

      {/* Center - Search */}
      <div className="relative hidden w-[420px] max-w-full md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search content..."
          className="w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Right - User */}
      <UserDropdown user={user} />
    </div>
  );
}
