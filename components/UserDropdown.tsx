"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type UserInfo = {
  name: string;
  email: string;
  username?: string;
};

type UserDropdownProps = {
  user?: UserInfo | null;
};

const getAvatarLabel = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
};

export default function UserDropdown({ user }: UserDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fallbackUser = {
    name: "Shrestha Kundu",
    email: "shrestha@example.com",
    username: "@shrestha.dev",
  };

  const activeUser = user || fallbackUser;
  const activeUsername =
    activeUser.username || `@${activeUser.email.split("@")[0] || activeUser.name.replace(/\s+/g, ".")}`;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Avatar */}
      <div
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black font-semibold text-white transition hover:scale-105"
      >
        {getAvatarLabel(activeUser.name)}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 z-50 mt-3 w-64 rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl"
          >
            <div className="mb-3">
              <p className="font-semibold text-slate-900">{activeUser.name}</p>
              <p className="text-sm text-slate-600">{activeUser.email}</p>
              <p className="text-sm text-blue-600">{activeUsername}</p>
            </div>

            <div className="space-y-2 border-t border-slate-200 pt-3">
              <button className="w-full rounded-md border border-slate-300 p-2 text-left text-sm text-slate-700 transition hover:bg-slate-100">
                Profile
              </button>
              <button className="w-full rounded-md border border-slate-300 p-2 text-left text-sm text-slate-700 transition hover:bg-slate-100">
                Settings
              </button>
              <button className="w-full rounded-md border border-red-300 p-2 text-left text-sm text-red-600 transition hover:bg-red-50">
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
