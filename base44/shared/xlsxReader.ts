// Minimal, dependency-free XLSX reader (first worksheet, string/number cells).
// Read-only inspection helper for INTERNAL artifact validation. No content is persisted.
const td = new TextDecoder();

async function inflateRaw(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function readZipDirectory(buf) {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("XLSX_ZIP_EOCD_NOT_FOUND");
  const count = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  const entries = {};
  for (let n = 0; n < count; n++) {
    if (view.getUint32(p, true) !== 0x02014b50) throw new Error("XLSX_ZIP_DIRECTORY_CORRUPT");
    const method = view.getUint16(p + 10, true);
    const compSize = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const localOffset = view.getUint32(p + 42, true);
    const name = td.decode(buf.subarray(p + 46, p + 46 + nameLen));
    entries[name] = { method, compSize, localOffset };
    p += 46 + nameLen + extraLen + commentLen;
  }
  return { entries, view };
}

async function readEntry(buf, view, e) {
  const nameLen = view.getUint16(e.localOffset + 26, true);
  const extraLen = view.getUint16(e.localOffset + 28, true);
  const start = e.localOffset + 30 + nameLen + extraLen;
  const data = buf.subarray(start, start + e.compSize);
  if (e.method === 0) return td.decode(data);
  if (e.method === 8) return td.decode(await inflateRaw(data));
  throw new Error("XLSX_ZIP_METHOD_UNSUPPORTED");
}

function decodeXml(s) {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&");
}

function textRuns(xml) {
  const parts = [];
  const re = /<(?:\w+:)?t(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?t>/g;
  let m;
  while ((m = re.exec(xml))) parts.push(decodeXml(m[1]));
  return parts.join("");
}

function colIndex(ref) {
  const letters = (ref.match(/^[A-Z]+/) || ["A"])[0];
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export async function readFirstSheet(bytes) {
  const buf = new Uint8Array(bytes);
  const { entries, view } = readZipDirectory(buf);
  const shared = [];
  if (entries["xl/sharedStrings.xml"]) {
    const xml = await readEntry(buf, view, entries["xl/sharedStrings.xml"]);
    const re = /<(?:\w+:)?si>([\s\S]*?)<\/(?:\w+:)?si>/g;
    let m;
    while ((m = re.exec(xml))) shared.push(textRuns(m[1]));
  }
  const sheetName = Object.keys(entries).filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort()[0];
  if (!sheetName) throw new Error("XLSX_NO_WORKSHEET");
  const xml = await readEntry(buf, view, entries[sheetName]);
  const rows = [];
  // Optional namespace prefixes (e.g. <x:row>) are supported.
  const rowRe = /<(?:\w+:)?row\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:\w+:)?row>)/g;
  let rm;
  while ((rm = rowRe.exec(xml))) {
    const inner = rm[1] || "";
    const row = [];
    const cellRe = /<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g;
    let cm;
    while ((cm = cellRe.exec(inner))) {
      const attrs = cm[1];
      const body = cm[2] || "";
      const ref = (attrs.match(/\br="([A-Z]+\d+)"/) || [])[1] || "A1";
      const type = (attrs.match(/\bt="([^"]+)"/) || [])[1];
      const v = (body.match(/<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/) || [])[1];
      let value = "";
      if (type === "s" && v !== undefined) value = shared[Number(v)] ?? "";
      else if (type === "inlineStr") value = textRuns(body);
      else if (v !== undefined) value = decodeXml(v);
      row[colIndex(ref)] = String(value);
    }
    for (let i = 0; i < row.length; i++) if (row[i] === undefined) row[i] = "";
    if (row.some((c) => c.trim() !== "")) rows.push(row);
  }
  return { sheetFile: sheetName, rows };
}