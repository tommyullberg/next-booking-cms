export function markdownToHtml(content: string): string {
  // If it already contains explicit HTML block elements, return as-is
  if (/<(h[1-6]|p|div|table|ul|ol|body|html)[\s>]/i.test(content)) {
    return content;
  }

  const lines = content.split("\n");
  const htmlParts: string[] = [];
  let paragraphLines: string[] = [];

  const formatInline = (text: string): string => {
    return text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #0284c7; text-decoration: underline;">$1</a>')
      .replace(/(?<!href=['"])(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color: #0284c7; text-decoration: underline;">$1</a>');
  };

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      const pText = paragraphLines.map((l) => formatInline(l)).join("<br/>");
      htmlParts.push(`<p style="margin: 0 0 14px 0; line-height: 1.6; font-size: 14px; color: #1e293b;">${pText}</p>`);
      paragraphLines = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      htmlParts.push(`<h1 style="font-size: 22px; font-weight: bold; margin: 0 0 16px 0; color: #0f172a;">${formatInline(line.slice(2))}</h1>`);
    } else if (line.startsWith("## ")) {
      flushParagraph();
      htmlParts.push(`<h2 style="font-size: 17px; font-weight: bold; margin: 0 0 14px 0; color: #0f172a;">${formatInline(line.slice(3))}</h2>`);
    } else {
      paragraphLines.push(line);
    }
  }

  flushParagraph();
  return htmlParts.join("\n");
}

export function renderMailTemplate(
  template: string,
  variables: Record<string, string | number | undefined | null>
): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    const valString = value !== undefined && value !== null ? String(value) : "";
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    rendered = rendered.replace(regex, valString);
  }

  // Convert clean markdown / plain text to styled HTML if not already full HTML
  return markdownToHtml(rendered);
}

