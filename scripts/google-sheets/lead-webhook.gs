/**
 * AR Group of Education — Google Sheets lead webhook
 *
 * Spreadsheet: https://docs.google.com/spreadsheets/d/1S0ORdP8VXbcAov1naf-ak7J5HsqSQp-qJLGLSDn-Bfg
 *
 * Tabs: MBBS INDIA | MBBS ABROAD | MD/MS | BAMS | Rank Predictor Leads
 *
 * Setup:
 * 1. Extensions → Apps Script → paste this file
 * 2. Script properties → WEBHOOK_SECRET
 * 3. Run setupSheets() once
 * 4. Deploy → Web app (Execute as: Me, Access: Anyone)
 * 5. Vercel: GOOGLE_SHEETS_WEBHOOK_URL + GOOGLE_SHEETS_WEBHOOK_SECRET
 */

var SPREADSHEET_ID = '1S0ORdP8VXbcAov1naf-ak7J5HsqSQp-qJLGLSDn-Bfg';
var SHEET_MBBS_INDIA = 'MBBS INDIA';
var SHEET_MBBS_ABROAD = 'MBBS ABROAD';
var SHEET_MD_MS = 'MD/MS';
var SHEET_BAMS = 'BAMS';
var SHEET_RANK = 'Rank Predictor Leads';
var TZ = 'Asia/Kolkata';

var COURSE_SHEETS = [SHEET_MBBS_INDIA, SHEET_MBBS_ABROAD, SHEET_MD_MS, SHEET_BAMS];

var COURSE_HEADERS = [
  'Lead ID',
  'Date',
  'Time',
  'Name',
  'Phone Number',
  'Email',
  'City',
  'State',
  'Country',
  'Course',
  'Source Page',
  'Form Type',
  'Message',
  'Created At',
];

var RANK_HEADERS = [
  'Name',
  'Phone Number',
  'Email',
  'NEET Score',
  'Predicted Rank',
  'State',
  'Course',
  'Timestamp',
  'Date',
  'Time',
];

var ABROAD_COUNTRIES = {
  russia: 1,
  nepal: 1,
  uzbekistan: 1,
  kazakhstan: 1,
  georgia: 1,
  kyrgyzstan: 1,
  bangladesh: 1,
  philippines: 1,
  armenia: 1,
  belarus: 1,
  egypt: 1,
  moldova: 1,
  tajikistan: 1,
  ukraine: 1,
  vietnam: 1,
};

function getSecret_() {
  return PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET') || '';
}

function jsonResponse_(obj) {
  var output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function doGet() {
  return jsonResponse_({ ok: true, service: 'ar-group-lead-webhook' });
}

function doPost(e) {
  try {
    var secret = getSecret_();
    if (!secret) {
      return jsonResponse_({ ok: false, message: 'Webhook secret not configured' });
    }

    var body = {};
    var incomingSecret = '';
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
      if (body.secret) incomingSecret = String(body.secret);
    }

    if (incomingSecret !== secret) {
      return jsonResponse_({ ok: false, message: 'Unauthorized' });
    }

    var type = body.type;
    var payload = body.payload || {};
    var requestId = body.requestId ? String(body.requestId) : '';

    if (requestId && isRecentDuplicateRequest_(requestId)) {
      return jsonResponse_({ ok: true, message: 'Already processed', leadId: requestId });
    }

    var phone = normalizePhone_(payload.phone);
    var email = normalizeEmail_(payload.email);

    if (type === 'rank_predictor') {
      if (!phone || !isValidIndianPhone_(phone)) {
        return jsonResponse_({ ok: false, message: 'Please enter a valid Indian mobile number.' });
      }
    } else if (phone && !isValidIndianPhone_(phone)) {
      return jsonResponse_({ ok: false, message: 'Please enter a valid Indian mobile number.' });
    }

    if (!email || !isValidEmail_(email)) {
      return jsonResponse_({ ok: false, message: 'Please enter a valid email address.' });
    }

    if (isDuplicateLead_(phone, email)) {
      return jsonResponse_({
        ok: false,
        duplicate: true,
        message:
          'We have already received your enquiry. Our counselling team will contact you shortly. For urgent assistance please call our support team.',
      });
    }

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var parts = getISTParts_();

    if (type === 'rank_predictor') {
      appendRankPredictorRow_(ss, payload, phone, email, parts);
    } else {
      var sheetName = resolveCourseSheet_(payload);
      appendCourseLeadRow_(ss, sheetName, payload, phone, email, parts);
    }

    if (requestId) markRequestProcessed_(requestId);

    return jsonResponse_({ ok: true, leadId: parts.leadId, sheet: type === 'rank_predictor' ? SHEET_RANK : resolveCourseSheet_(payload) });
  } catch (err) {
    Logger.log('lead-webhook error: ' + err);
    var detail = err && err.message ? String(err.message) : String(err);
    return jsonResponse_({
      ok: false,
      message:
        detail.indexOf('storage') !== -1 || detail.indexOf('quota') !== -1
          ? 'Google Drive storage is full. Free up space in Google Drive, then try again.'
          : 'Sheet error: ' + detail.slice(0, 200),
    });
  }
}

function setupSheets() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  for (var i = 0; i < COURSE_SHEETS.length; i++) {
    ensureSheet_(ss, COURSE_SHEETS[i], COURSE_HEADERS);
  }
  ensureSheet_(ss, SHEET_RANK, RANK_HEADERS);
}

function ensureSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

function resolveCourseSheet_(payload) {
  var sheetKey = sanitize_(payload.sheetKey, 40).toUpperCase();
  if (sheetKey === 'MBBS INDIA') return SHEET_MBBS_INDIA;
  if (sheetKey === 'MBBS ABROAD') return SHEET_MBBS_ABROAD;
  if (sheetKey === 'MD/MS' || sheetKey === 'MD-MS') return SHEET_MD_MS;
  if (sheetKey === 'BAMS') return SHEET_BAMS;

  var country = sanitize_(payload.country, 80);
  if (country && isAbroadCountry_(country)) return SHEET_MBBS_ABROAD;

  var course = sanitize_(payload.course, 120).toLowerCase();
  if (course.indexOf('mbbs abroad') !== -1 || course.indexOf('abroad') !== -1) return SHEET_MBBS_ABROAD;
  if (course.indexOf('md/ms') !== -1 || course.indexOf('md-ms') !== -1) return SHEET_MD_MS;
  if (course.indexOf('bams') !== -1) return SHEET_BAMS;
  if (course.indexOf('mbbs india') !== -1 || course.indexOf('mbbs-india') !== -1) return SHEET_MBBS_INDIA;

  var source = sanitize_(payload.source, 120).toLowerCase();
  if (source.indexOf('mbbs-abroad') !== -1 || source.indexOf('abroad') !== -1) return SHEET_MBBS_ABROAD;
  if (source.indexOf('md-ms') !== -1) return SHEET_MD_MS;
  if (source.indexOf('bams') !== -1) return SHEET_BAMS;
  if (source.indexOf('mbbs-india') !== -1) return SHEET_MBBS_INDIA;

  return SHEET_MBBS_INDIA;
}

function isAbroadCountry_(name) {
  return !!ABROAD_COUNTRIES[String(name).trim().toLowerCase()];
}

function normalizePhone_(raw) {
  if (!raw) return '';
  var digits = String(raw).replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.indexOf('91') === 0) return digits.slice(2);
  if (digits.length === 11 && digits.indexOf('0') === 0) return digits.slice(1);
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function isValidIndianPhone_(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

function normalizeEmail_(raw) {
  if (!raw) return '';
  return String(raw).trim().toLowerCase();
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitize_(value, maxLen) {
  var s = String(value || '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/<[^>]*>/g, '')
    .trim();
  if (s.length > maxLen) return s.slice(0, maxLen);
  return s;
}

function isDuplicateLead_(phone, email) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var allSheets = COURSE_SHEETS.concat([SHEET_RANK]);

  for (var s = 0; s < allSheets.length; s++) {
    var sheet = ss.getSheetByName(allSheets[s]);
    if (!sheet) continue;

    var phoneCol = allSheets[s] === SHEET_RANK ? 2 : 5;
    var emailCol = allSheets[s] === SHEET_RANK ? 3 : 6;

    if (phone && phoneExistsInSheet_(sheet, phoneCol, phone)) return true;
    if (email && emailExistsInSheet_(sheet, emailCol, email)) return true;
  }
  return false;
}

function phoneExistsInSheet_(sheet, col, phone) {
  if (!sheet || sheet.getLastRow() < 2) return false;
  var lastRow = sheet.getLastRow();
  var values = sheet.getRange(2, col, lastRow, col).getValues();
  for (var i = 0; i < values.length; i++) {
    if (normalizePhone_(values[i][0]) === phone) return true;
  }
  return false;
}

function emailExistsInSheet_(sheet, col, email) {
  if (!sheet || sheet.getLastRow() < 2) return false;
  var lastRow = sheet.getLastRow();
  var values = sheet.getRange(2, col, lastRow, col).getValues();
  for (var i = 0; i < values.length; i++) {
    if (normalizeEmail_(values[i][0]) === email) return true;
  }
  return false;
}

function getISTParts_() {
  var now = new Date();
  var dateStr = Utilities.formatDate(now, TZ, 'dd-MM-yyyy');
  var timeStr = Utilities.formatDate(now, TZ, 'HH:mm:ss');
  var timestamp = Utilities.formatDate(now, TZ, "yyyy-MM-dd'T'HH:mm:ss");
  var leadId =
    'LR-' +
    Utilities.formatDate(now, TZ, 'yyyyMMddHHmmss') +
    '-' +
    Math.floor(Math.random() * 9000 + 1000);
  return { date: dateStr, time: timeStr, timestamp: timestamp, leadId: leadId, createdAt: timestamp };
}

function appendCourseLeadRow_(ss, sheetName, payload, phone, email, parts) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    ensureSheet_(ss, sheetName, COURSE_HEADERS);
    sheet = ss.getSheetByName(sheetName);
  }

  var country = sanitize_(payload.country, 80);
  if (!country && sheetName === SHEET_MBBS_ABROAD) {
    var course = sanitize_(payload.course, 120);
    if (isAbroadCountry_(course)) country = course;
  }

  sheet.appendRow([
    parts.leadId,
    parts.date,
    parts.time,
    sanitize_(payload.name, 120),
    phone,
    email,
    sanitize_(payload.city, 80),
    sanitize_(payload.state, 80),
    country,
    sanitize_(payload.course, 120),
    sanitize_(payload.sourcePage, 300),
    sanitize_(payload.formType, 120),
    sanitize_(payload.message, 2000),
    parts.createdAt,
  ]);
}

function appendRankPredictorRow_(ss, payload, phone, email, parts) {
  var sheet = ss.getSheetByName(SHEET_RANK);
  if (!sheet) {
    ensureSheet_(ss, SHEET_RANK, RANK_HEADERS);
    sheet = ss.getSheetByName(SHEET_RANK);
  }

  sheet.appendRow([
    sanitize_(payload.name, 120),
    phone,
    email,
    Number(payload.neetScore) || 0,
    Number(payload.predictedRank) || 0,
    sanitize_(payload.state, 80),
    sanitize_(payload.course, 120),
    parts.timestamp,
    parts.date,
    parts.time,
  ]);
}

function isRecentDuplicateRequest_(requestId) {
  var cache = CacheService.getScriptCache();
  return cache.get('req_' + requestId) === '1';
}

function markRequestProcessed_(requestId) {
  CacheService.getScriptCache().put('req_' + requestId, '1', 120);
}
