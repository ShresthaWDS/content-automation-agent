"use client";

import { motion } from "framer-motion";

type HistoryItemData = {
  title: string;
  createdAt: string;
};

type HistoryItemProps = {
  item: HistoryItemData;
  onClick?: () => void;
  active?: boolean;
  theme?: "light" | "dark";
};

export default function HistoryItem({ item, onClick, active = false, theme = "light" }: HistoryItemProps) {
  const isDark = theme === "dark";

  const baseClasses = isDark
    ? "border text-slate-100"
    : "border border-transparent text-slate-700";

  const activeClasses = isDark
    ? "border-blue-500/50 bg-blue-500/20 shadow-[0_0_0_1px_rgba(59,130,246,0.25)]"
    : "border-slate-200 bg-slate-100";

  const hoverClasses = isDark
    ? "hover:bg-slate-700/70 hover:border-slate-600"
    : "hover:bg-slate-100 hover:border-slate-200";

  const dateClasses = isDark ? "text-blue-300" : "text-slate-500";

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -1 }}
      onClick={onClick}
      className={`mb-2 cursor-pointer rounded-md p-3 transition-all hover:-translate-y-0.5 ${baseClasses} ${
        active ? activeClasses : hoverClasses
      }`}
    >
      <p className={`truncate text-sm font-medium ${isDark ? "text-white" : "text-slate-700"}`}>{item.title}</p>
      <p className={`text-xs ${dateClasses}`}>
        {new Date(item.createdAt).toLocaleDateString()}
      </p>
    </motion.div>
  );
}
