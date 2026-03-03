"use client";

import HistoryItem from "./HistoryItem";

export default function Sidebar({ contents }: any) {
  return (
    <div className="w-64 bg-zinc-900 border-r border-zinc-800 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">History</h2>

      {contents.length === 0 && (
        <p className="text-sm text-zinc-500">No content generated yet.</p>
      )}

      {contents.map((c: any) => (
        <HistoryItem key={c._id} item={c} />
      ))}
    </div>
  );
}