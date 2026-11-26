import type { ReactNode } from "react";
import s from "../calendar.module.css";

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;

function inline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

/** Renders the lightweight markdown the AI uses: bold, italics, headings and lists. */
export default function FormattedText({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (!list?.items.length) {
      list = null;
      return;
    }
    const items = list.items.map((item, i) => <li key={i}>{inline(item)}</li>);
    blocks.push(
      list.ordered ? (
        <ol key={blocks.length} className={s.aiList}>{items}</ol>
      ) : (
        <ul key={blocks.length} className={s.aiList}>{items}</ul>
      ),
    );
    list = null;
  };

  for (const line of text.split("\n")) {
    const value = line.trim();
    if (!value) {
      flush();
      continue;
    }

    const bullet = /^[-*]\s+(.+)$/.exec(value);
    const numbered = /^\d+[.)]\s+(.+)$/.exec(value);
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      if (list && list.ordered !== ordered) flush();
      list ??= { ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]);
      continue;
    }

    flush();
    const heading = /^#{1,6}\s+(.+)$/.exec(value);
    const boldOnly = /^\*\*(.+)\*\*$/.exec(value);
    if (heading || boldOnly) {
      blocks.push(
        <p key={blocks.length} className={s.aiHeading}>
          {inline((heading ?? boldOnly)![1])}
        </p>,
      );
    } else {
      blocks.push(<p key={blocks.length}>{inline(value)}</p>);
    }
  }
  flush();

  return <div className={s.aiRich}>{blocks}</div>;
}
