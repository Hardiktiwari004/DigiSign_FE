export function makeSafePdfFilename(title: string, fallbackName = "document") {
  const baseName = title
    .trim()
    .replace(/\.pdf$/i, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]+/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `${baseName || fallbackName}.pdf`;
}
