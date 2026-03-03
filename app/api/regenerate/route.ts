import { connectDB } from "@/lib/mongodb";
import Content from "@/models/Content";
import { generateContent } from "@/lib/ai";

export async function POST(req: Request) {
  await connectDB();

  const { id } = await req.json();
  const content = await Content.findById(id);

  const regenerated = await generateContent(content.rawContent);

  content.xContent = regenerated.x;
  content.linkedinContent = regenerated.linkedin;

  await content.save();

  return Response.json(content);
}