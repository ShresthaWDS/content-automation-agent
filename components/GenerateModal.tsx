"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function GenerateModal({ open, setOpen, setContents }: any) {
  const [title, setTitle] = useState("");
  const [rawContent, setRawContent] = useState("");

  if (!open) return null;

  const generate = async () => {
    const res = await fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify({ title, rawContent }),
    });

    const data = await res.json();
    setContents((prev: any) => [data, ...prev]);
    setOpen(false);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 flex justify-center items-center backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="bg-zinc-900 p-8 rounded-2xl w-[500px]">
        <h2 className="text-xl mb-4">Create Content</h2>

        <input
          className="w-full bg-zinc-800 p-3 rounded-lg mb-4"
          placeholder="Title"
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="w-full bg-zinc-800 p-3 rounded-lg h-32"
          placeholder="Raw Content"
          onChange={(e) => setRawContent(e.target.value)}
        />

        <button
          onClick={generate}
          className="bg-sky-700 px-4 py-2 rounded-lg mt-4 w-full"
        >
          Generate for X & LinkedIn
        </button>
      </div>
    </motion.div>
  );
}