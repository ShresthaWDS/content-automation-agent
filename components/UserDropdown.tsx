"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function UserDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const user = {
    name: "Shrestha Kundu",
    email: "shrestha@example.com",
    username: "@shrestha.dev",
  };

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
        className="w-10 h-10 rounded-full bg-sky-700 flex items-center justify-center font-semibold cursor-pointer hover:scale-105 transition"
      >
        SK
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-3 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-4 z-50"
          >
            <div className="mb-3">
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-zinc-400">{user.email}</p>
              <p className="text-sm text-indigo-400">{user.username}</p>
            </div>

            <div className="border-t border-zinc-800 pt-3">
              <button className="w-full text-left text-sm hover:bg-zinc-800 p-2 rounded-lg transition">
                Profile
              </button>
              <button className="w-full text-left text-sm hover:bg-zinc-800 p-2 rounded-lg transition">
                Settings
              </button>
              <button className="w-full text-left text-red-400 hover:bg-zinc-800 p-2 rounded-lg transition">
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}