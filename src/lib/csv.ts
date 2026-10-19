type Row = Record<string, string | number | null>;

function cell(v: string | number | null): string {
  const s = v === null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Row[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  return [headers.join(','), ...rows.map((r) => headers.map((h) => cell(r[h] ?? null)).join(','))].join('\r\n');
}

/** Save a file on the phone/computer. The BOM makes Excel read Chinese text correctly. */
export function download(filename: string, content: string, mime: string): void {
  const bom = mime.startsWith('text/csv') ? '﻿' : '';
  const blob = new Blob([bom + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
