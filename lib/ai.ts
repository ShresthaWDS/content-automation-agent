export async function generateContent(raw: string) {
  return {
    x: `🔥 X Version:\n\n${raw}\n\n#AI #Content`,
    linkedin: `🚀 LinkedIn Version:\n\n${raw}\n\nLet's discuss your thoughts below.`,
  };
}