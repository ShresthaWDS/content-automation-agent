export default function ContentCard({ content }: any) {
  const regenerate = async () => {
    await fetch("/api/regenerate", {
      method: "POST",
      body: JSON.stringify({ id: content._id }),
    });
  };

  const post = async () => {
    await fetch("/api/post", {
      method: "POST",
      body: JSON.stringify({ id: content._id }),
    });
  };

  return (
    <div className="bg-zinc-900 p-6 rounded-2xl shadow-lg">
      <h3 className="font-semibold mb-3">{content.title}</h3>

      <div className="mb-4">
        <h4 className="text-indigo-400">X Version</h4>
        <p className="text-sm text-zinc-400">{content.xContent}</p>
      </div>

      <div className="mb-4">
        <h4 className="text-indigo-400">LinkedIn Version</h4>
        <p className="text-sm text-zinc-400">
          {content.linkedinContent}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={regenerate}
          className="bg-yellow-600 px-4 py-2 rounded-lg"
        >
          Regenerate
        </button>

        <button
          onClick={post}
          className="bg-green-600 px-4 py-2 rounded-lg"
        >
          Post
        </button>
      </div>
    </div>
  );
}