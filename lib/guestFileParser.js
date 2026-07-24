import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

// Matches phone-like digit runs (at least 7 digits, allowing spaces/()/-/+)
const PHONE_REGEX = /(\+?\d[\d\s().-]{6,}\d)/;

function cleanPhone(raw) {
  if (!raw) return '';
  const digits = String(raw).replace(/[^\d+]/g, '').trim();
  return digits.length >= 7 ? digits : '';
}

// Splits "John Doe" -> {firstName:'John', lastName:'Doe'}
// Also supports "Doe, John" -> {firstName:'John', lastName:'Doe'}
function splitName(nameStr) {
  const cleaned = String(nameStr || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;

  if (cleaned.includes(',')) {
    const [last, first] = cleaned.split(',').map(s => s.trim());
    if (first && last) return { firstName: first, lastName: last };
  }

  const parts = cleaned.split(' ').filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };

  const lastName = parts.pop();
  const firstName = parts.join(' ');
  return { firstName, lastName };
}

const NON_NAME_KEYWORDS = [
  'guest list', 'invitee', 'attendee', 'table plan', 'seating chart',
  'guest name', 'phone number', 'contact number', 'wedding of',
  'reception', 'ceremony', 'rsvp list', 'invitation list', 'full name',
  'first name', 'last name', 'surname', 'table number'
];

function isLikelyNonNameLine(line) {
  const lower = line.toLowerCase();
  if (NON_NAME_KEYWORDS.some(k => lower.includes(k))) return true;
  // Standalone headings like "Guests" / "Table" / "Name"
  if (/^(guest list|table|name|attendees?|guests?)$/i.test(line)) return true;
  // Page-break / pagination markers like "-- 1 of 3 --"
  if (/^-*\s*\d+\s*of\s*\d+\s*-*$/i.test(line)) return true;
  // Needs at least two letters to plausibly be a name
  if (!/[a-zA-Z]{2,}/.test(line)) return true;
  return false;
}

// Free-text extraction for .docx / .pdf: one guest per line
function extractGuestsFromLines(lines) {
  const guests = [];
  for (const raw of lines) {
    let line = String(raw || '').replace(/^\s*[-*\u2022\d]+[.)]?\s*/, '').trim();
    if (!line || line.length < 2) continue;

    let phone = '';
    const phoneMatch = line.match(PHONE_REGEX);
    if (phoneMatch) {
      const candidate = cleanPhone(phoneMatch[1]);
      if (candidate) {
        phone = candidate;
        line = (line.slice(0, phoneMatch.index) + ' ' + line.slice(phoneMatch.index + phoneMatch[1].length)).trim();
      }
    }
    line = line.replace(/[|,\-–:]+$/, '').replace(/^[|,\-–:]+/, '').trim();
    line = line.replace(/\s{2,}/g, ' ').trim();

    if (!line || isLikelyNonNameLine(line)) continue;

    const split = splitName(line);
    if (!split || !split.firstName) continue;

    guests.push({ firstName: split.firstName, lastName: split.lastName, phoneNumber: phone });
  }
  return guests;
}

const FIRST_NAME_KEYS = ['first name', 'firstname', 'first'];
const LAST_NAME_KEYS = ['last name', 'lastname', 'surname', 'last'];
const FULL_NAME_KEYS = ['name', 'full name', 'guest name', 'guest', 'attendee', 'attendee name'];
const PHONE_KEYS = ['phone', 'phone number', 'cell', 'mobile', 'contact', 'tel', 'whatsapp', 'cell number', 'contact number'];
const TABLE_KEYS = ['table', 'table number', 'table no', 'seat', 'seat number'];

function normalizeHeader(h) {
  return String(h == null ? '' : h).toLowerCase().trim();
}

// Row-based extraction for .xlsx / .xls / .csv
function extractGuestsFromRows(rows) {
  if (!rows || rows.length === 0) return [];

  // Look at the first few rows for a recognizable header
  let headerIdx = -1;
  let colMap = {};
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const row = (rows[i] || []).map(normalizeHeader);
    const map = {};
    row.forEach((cell, idx) => {
      if (FIRST_NAME_KEYS.includes(cell)) map.firstName = idx;
      else if (LAST_NAME_KEYS.includes(cell)) map.lastName = idx;
      else if (FULL_NAME_KEYS.includes(cell)) map.fullName = idx;
      else if (PHONE_KEYS.includes(cell)) map.phone = idx;
      else if (TABLE_KEYS.includes(cell)) map.table = idx;
    });
    if (Object.keys(map).length > 0) {
      headerIdx = i;
      colMap = map;
      break;
    }
  }

  const guests = [];
  const dataRows = headerIdx >= 0 ? rows.slice(headerIdx + 1) : rows;

  for (const row of dataRows) {
    if (!row || row.every(c => c === '' || c === null || c === undefined)) continue;

    let firstName = '', lastName = '', phone = '', table = null;

    if (headerIdx >= 0 && (colMap.firstName !== undefined || colMap.fullName !== undefined)) {
      if (colMap.fullName !== undefined && colMap.firstName === undefined) {
        const split = splitName(row[colMap.fullName]);
        if (split) { firstName = split.firstName; lastName = split.lastName; }
      } else {
        firstName = String(row[colMap.firstName] || '').trim();
        lastName = colMap.lastName !== undefined ? String(row[colMap.lastName] || '').trim() : '';
      }
      if (colMap.phone !== undefined) phone = cleanPhone(row[colMap.phone]);
      if (colMap.table !== undefined) {
        const t = parseInt(row[colMap.table], 10);
        if (!isNaN(t)) table = t;
      }
    } else {
      // No recognizable header — guess positionally: col0=name, col1=surname/phone, col2=phone
      const c0 = String(row[0] || '').trim();
      const c1 = String(row[1] || '').trim();
      const c2 = String(row[2] || '').trim();
      if (!c0) continue;

      const c1LooksPhone = /^[\d+()\-\s]{6,}$/.test(c1);
      if (c1 && !c1LooksPhone) {
        firstName = c0;
        lastName = c1;
        phone = c2 ? cleanPhone(c2) : '';
      } else {
        const split = splitName(c0);
        firstName = split ? split.firstName : c0;
        lastName = split ? split.lastName : '';
        phone = c1LooksPhone ? cleanPhone(c1) : (c2 ? cleanPhone(c2) : '');
      }
    }

    if (!firstName) continue;
    guests.push({ firstName, lastName, phoneNumber: phone, tableNumber: table });
  }
  return guests;
}

/**
 * Parses an uploaded guest list file and returns an array of
 * { firstName, lastName, phoneNumber, tableNumber } objects.
 * Duplicate names are always preserved — never deduplicated here.
 *
 * @param {Buffer} buffer - raw file bytes
 * @param {string} filename - original filename (used to detect type by extension)
 */
export async function parseGuestFile(buffer, filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();

  if (['csv', 'xlsx', 'xls', 'xlsm'].includes(ext)) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
    return extractGuestsFromRows(rows);
  }

  if (ext === 'docx') {
    const result = await mammoth.extractRawText({ buffer });
    const lines = result.value.split('\n').map(l => l.trim()).filter(Boolean);
    return extractGuestsFromLines(lines);
  }

  if (ext === 'doc') {
    throw new Error('Legacy .doc files are not supported. Please save the file as .docx or PDF and try again.');
  }

  if (ext === 'pdf') {
    const parser = new PDFParse({ data: buffer });
    let text = '';
    try {
      const result = await parser.getText();
      text = result.text || '';
    } finally {
      await parser.destroy();
    }
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    return extractGuestsFromLines(lines);
  }

  throw new Error(`Unsupported file type: .${ext}. Please upload a CSV, Excel (.xlsx/.xls), Word (.docx), or PDF file.`);
}
