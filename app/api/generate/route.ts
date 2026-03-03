import { connectDB } from "@/lib/mongodb";
import Content from "@/models/Content";
import { generateContent } from "@/lib/ai";

export async function POST(req: Request) {
  await connectDB();

  const { title, rawContent } = await req.json();

  const generated = await generateContent(rawContent);

  const content = await Content.create({
    title,
    rawContent,
    xContent: generated.x,
    linkedinContent: generated.linkedin,
  });

  return Response.json(content);
}