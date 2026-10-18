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
  return rendered;
}
