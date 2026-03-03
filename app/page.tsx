"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import GenerateModal from "@/components/GenerateModal";
import ContentCard from "@/components/ContentCard";

export default function Home() {
  const [contents, setContents] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen">
      <Sidebar contents={contents} />

      <div className="flex-1 flex flex-col">
        <Header />

        <div className="p-8 flex-1 overflow-y-auto mx-auto">
          <button
            onClick={() => setOpen(true)}
            className="bg-sky-700 px-6 py-3 rounded-xl hover:bg-sky-800 transition cursor-pointer"
          >
            Enter Raw Content
          </button>

          <div className="grid grid-cols-2 gap-6 mt-8">
            {contents.map((c) => (
              <ContentCard key={c._id} content={c} />
            ))}
          </div>
        </div>
      </div>

      <GenerateModal
        open={open}
        setOpen={setOpen}
        setContents={setContents}
      />
    </div>
  );
}