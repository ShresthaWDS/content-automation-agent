import { Linkedin } from "lucide-react";

export default function LinkedInPreview({ content }: { content: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">

      {/* Header */}
      <div className="mb-3 flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
          <Linkedin size={18} />
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800">
            Your Name
          </p>
          <p className="text-xs text-slate-500">
            LinkedIn • Just now
          </p>
        </div>

      </div>

      {/* Post Content */}
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {content}
      </p>

      {/* Footer */}
      <div className="mt-4 flex gap-6 text-xs text-slate-500">
        <span>👍 Like</span>
        <span>💬 Comment</span>
        <span>🔁 Repost</span>
        <span>✉ Send</span>
      </div>

    </div>
  );
}