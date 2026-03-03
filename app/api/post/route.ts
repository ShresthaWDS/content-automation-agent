import { connectDB } from "@/lib/mongodb";
import Content from "@/models/Content";

export async function POST(req: Request) {
  await connectDB();

  const { id } = await req.json();
  const content = await Content.findByIdAndUpdate(
    id,
    { status: "posted" },
    { new: true }
  );

  return Response.json(content);
}