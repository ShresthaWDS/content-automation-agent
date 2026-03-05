import { useEffect, useState } from "react";

export default function TypingText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let index = 0;

    const interval = setInterval(() => {
      setDisplayed(text.slice(0, index));
      index++;

      if (index > text.length) clearInterval(interval);
    }, 10);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed">
      {displayed}
      <span className="animate-pulse">|</span>
    </p>
  );
}