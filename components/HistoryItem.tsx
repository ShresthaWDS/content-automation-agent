"use client";

import { motion } from "framer-motion";

export default function HistoryItem({ item, onClick }: any) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="p-3 rounded-xl cursor-pointer bg-zinc-800 hover:bg-zinc-700 transition mb-2"
    >
      <p className="text-sm font-medium truncate">{item.title}</p>
      <p className="text-xs text-zinc-400">
        {new Date(item.createdAt).toLocaleDateString()}
      </p>
    </motion.div>
  );
}