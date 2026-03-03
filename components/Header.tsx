"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import UserDropdown from "./UserDropdown";
import logo from "@/public/logo.png";

export default function Header() {
  const [query, setQuery] = useState("");

  return (
    <div className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6">
      {/* Left - Logo */}
      <div className="flex items-center gap-3">
        <img className="h-10" src={logo.src} alt="WDS" />
      </div>

      {/* Center - Search */}
      <div className="relative w-[400px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search content..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        />
      </div>

      {/* Right - User */}
      <UserDropdown />
    </div>
  );
}