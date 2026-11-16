/**
 * Connectrip Japan | Booking requests Web App
 * Contract 0.3 / Private Guide Booking Rules V1.1
 *
 * Target sheet: Connectrip Traveler Bookings (Test)
 * Spreadsheet ID: 1x2v55u5F-v2RNl9wfKyl_A_v8HzsJxWIEFRGbRmie3Y
 * Paste this file into the booking Apps Script project as Code.gs.
 * Script property BOOKING_GAS_SECRET must be at least 32 characters.
 * This is not the guide application or interview script.
 *
 * 2026-11-16: also stores Inquiry form submissions (action inquiries.create,
 * sheet "Inquiries", created with its header row on first use). The website
 * emails the team after the row is stored; this script only sends the short
 * notification without personal data (Config: admin_notification_emails).
 */

var CONFIG = {
  SHEET_BOOKINGS: 'Bookings',
  SHEET_STATUS_LOG: 'StatusLog',
  SHEET_NONCES: 'Nonces',
  SHEET_CONFIG: 'Config',
  SHEET_INQUIRIES: 'Inquiries',
  SECRET_PROP_KEY: 'BOOKING_GAS_SECRET',
  LOCK_TIMEOUT_MS: 8000,
  NONCE_TTL_MINUTES: 10,
  TIMESTAMP_TOLERANCE_MS: 300000,
  SOURCE: 'website_v1',
  CURRENCY: 'JPY'
};

var BOOKING_HEADERS = [
  'booking_ref',
  'submission_id',
  'body_hash',
  'idempotency_state',
  'created_at',
  'source',
  'locale',
  'product_type',
  'experience_id',
  'plan_id',
  'date',
  'start_time',
  'duration_minutes',
  'alternate_date',
  'alternate_start_time',
  'chosen_slot',
  'adults',
  'children',
  'areas',
  'interests',
  'traveler_name',
  'email',
  'phone',
  'country',
  'notes',
  'consent_at',
  'rules_checked_at',
  'status',
  'quoted_amount_jpy',
  'currency',
  'quote_sent_at',
  'guide_hold',
  'guide_hold_until',
  'guide_hold_note',
  'stripe_invoice_id',
  'stripe_invoice_url',
  'stripe_invoice_status',
  'invoice_issued_at',
  'pay_by',
  'pay_window_elapsed_at',
  'stripe_checked_at',
  'paid_at',
  'late_payment',
  'exception_reason',
  'confirmed_at',
  'stripe_refund_id',
  'refund_status',
  'reply_due_at',
  'reply_due_basis',
  'admin_note',
  'updated_at'
];

var PROTECTED_HEADERS = {
  booking_ref: true,
  submission_id: true,
  body_hash: true,
  idempotency_state: true,
  rules_checked_at: true,
  status: true,
  quote_sent_at: true,
  stripe_invoice_status: true,
  invoice_issued_at: true,
  pay_by: true,
  pay_window_elapsed_at: true,
  stripe_checked_at: true,
  paid_at: true,
  confirmed_at: true,
  reply_due_at: true
};

var START_TIMES = {
  '08:00': true, '08:30': true, '09:00': true, '09:30': true, '10:00': true, '10:30': true,
  '11:00': true, '11:30': true, '12:00': true, '12:30': true, '13:00': true, '13:30': true,
  '14:00': true, '14:30': true, '15:00': true, '15:30': true, '16:00': true, '16:30': true, '17:00': true
};
var DURATIONS = { 240: true, 360: true, 480: true };
var LOCALES = { ja: true, en: true, 'zh-TW': true, ko: true };
var AREAS = { osaka: true, kyoto: true, kobe: true, nara: true, other: true };
var INTERESTS = {
  food: true, local_neighborhoods: true, culture: true, famous_sights: true,
  shopping: true, family_activities: true, hidden_gems: true, other: true
};
var UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
var PHONE = /^\+?[0-9 ()-]{6,30}$/;
var BOOKING_REF = /^CR-\d{8}-[A-Z0-9]{6}$/;
var INQUIRY_REF = /^CQ-\d{8}-[A-Z0-9]{6}$/;

var INQUIRY_HEADERS = [
  'inquiry_ref',
  'submission_id',
  'body_hash',
  'created_at',
  'source',
  'kind',
  'name',
  'email',
  'preferred_date',
  'adults',
  'children',
  'destinations',
  'activities',
  'places_to_visit',
  'ideal_day',
  'notes',
  'status',
  'admin_note',
  'updated_at'
];

function doPost(e) {
  try {
    var rawContent = (e && e.postData && e.postData.contents) ? e.postData.contents : '';
    if (!rawContent) return errorCode('UNAUTHORIZED');

    var requestJson;
    try {
      requestJson = JSON.parse(rawContent);
    } catch (err) {
      return errorCode('UNAUTHORIZED');
    }

    var action = requestJson.action;
    var ts = requestJson.ts;
    var nonce = requestJson.nonce;
    var payload = requestJson.payload;
    var signature = requestJson.sig || requestJson.signature;
    var version = requestJson.v !== undefined ? requestJson.v : 1;

    if (version !== 1 && version !== '1') return errorCode('UNAUTHORIZED');
    if (typeof payload !== 'string') return errorCode('UNAUTHORIZED');

    var authResult = verifyHmacSignature(action, ts, nonce, payload, signature);
    if (!authResult.valid) return errorCode('UNAUTHORIZED');

    if (action === 'bookingRequests.create') return handleBookingCreate(payload);
    if (action === 'bookingRequests.getBySubmissionId') return handleGetBySubmissionId(payload);
    if (action === 'inquiries.create') return handleInquiryCreate(payload);
    return errorCode('UNAUTHORIZED');
  } catch (err) {
    return errorCode('INTERNAL');
  }
}

function verifyHmacSignature(action, ts, nonce, payload, signature) {
  if (!action || ts === undefined || ts === null || ts === '' || !nonce || !payload || !signature) {
    return { valid: false, reason: 'missing' };
  }
  if (action !== 'bookingRequests.create' && action !== 'bookingRequests.getBySubmissionId') {
    return { valid: false, reason: 'action' };
  }

  var nowMs = Date.now();
  var requestTs = Number(ts);
  if (isNaN(requestTs) || Math.abs(nowMs - requestTs) > CONFIG.TIMESTAMP_TOLERANCE_MS) {
    return { valid: false, reason: 'timestamp' };
  }

  var secret = PropertiesService.getScriptProperties().getProperty(CONFIG.SECRET_PROP_KEY);
  if (!secret || String(secret).length < 32) return { valid: false, reason: 'secret' };

  var message = 'v1\n' + action + '\n' + ts + '\n' + nonce + '\n' + payload;
  if (!timingSafeEqual(String(signature), computeHmacSha256Base64Url(secret, message))) {
    return { valid: false, reason: 'mismatch' };
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(CONFIG.LOCK_TIMEOUT_MS)) return { valid: false, reason: 'lock' };

  try {
    var nonceSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NONCES);
    if (!nonceSheet) return { valid: false, reason: 'nonce-sheet' };
    var data = nonceSheet.getDataRange().getValues();
    var tenMinAgoMs = nowMs - CONFIG.NONCE_TTL_MINUTES * 60 * 1000;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(nonce)) return { valid: false, reason: 'replay' };
    }
    nonceSheet.appendRow([
      String(nonce),
      new Date(nowMs).toISOString(),
      new Date(nowMs + CONFIG.NONCE_TTL_MINUTES * 60 * 1000).toISOString()
    ]);
    for (var row = data.length - 1; row >= 1; row--) {
      var seenMs = new Date(data[row][1]).getTime();
      if (!isNaN(seenMs) && seenMs < tenMinAgoMs) nonceSheet.deleteRow(row + 1);
    }
    return { valid: true };
  } finally {
    lock.releaseLock();
  }
}

function handleBookingCreate(rawPayload) {
  var parsed;
  try {
    parsed = JSON.parse(rawPayload);
  } catch (e) {
    return errorCode('VALIDATION');
  }
  if (!parsed || typeof parsed !== 'object' || !parsed.booking || typeof parsed.booking !== 'object' || Array.isArray(parsed.booking)) {
    return errorCode('VALIDATION');
  }

  var req = parsed.booking;
  if (honeypot(req)) return jsonResponse({ ok: true, accepted: false });
  if (typeof parsed.bodyHash !== 'string' || !/^[0-9a-f]{64}$/.test(parsed.bodyHash)) return errorCode('VALIDATION');

  var canonical = canonicalBooking(req);
  var invalid = validateCanonical(canonical, req);
  if (invalid) return errorCode(invalid);
  var bodyHash = hashCanonical(canonical);
  if (bodyHash !== parsed.bodyHash) return errorCode('VALIDATION');

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(CONFIG.LOCK_TIMEOUT_MS)) return errorCode('INTERNAL');

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_BOOKINGS);
    if (!sheet) return errorCode('INTERNAL');
    if (!bookingHeadersMatch(sheet)) return errorCode('SHEET_HEADER_MISMATCH');

    var values = sheet.getDataRange().getValues();
    var found = findSubmission(values, canonical.submissionId);
    if (found && found.bodyHash !== bodyHash) return errorCode('DUPLICATE_CONFLICT');
    if (found && found.state === 'COMMITTED') {
      if (!BOOKING_REF.test(found.bookingRef)) return errorCode('INTERNAL');
      return created(found.bookingRef, true);
    }

    var nowIso = new Date().toISOString();
    var bookingRef = found && BOOKING_REF.test(found.bookingRef) ? found.bookingRef : generateBookingRef();
    var createdAt = found && found.createdAt ? found.createdAt : nowIso;
    var holidays = getHolidaysList(ss.getSheetByName(CONFIG.SHEET_CONFIG));
    var due = calculateReplyDueAt(new Date(), holidays);
    var record = bookingRecord(canonical, bookingRef, bodyHash, createdAt, nowIso, due);
    var rowNumber = found ? found.rowNumber : sheet.getLastRow() + 1;

    record.idempotency_state = 'IN_PROGRESS';
    record.status = '';
    writeBookingRow(sheet, rowNumber, record);
    record.idempotency_state = 'COMMITTED';
    record.status = 'REQUESTED';
    record.updated_at = new Date().toISOString();
    writeBookingRow(sheet, rowNumber, record);

    if (!found || found.state !== 'COMMITTED') {
      logStatus(ss, bookingRef, found ? found.status : 'NONE', 'REQUESTED', 'bookingRequests.create', 'system', 'Booking request committed');
      sendAdminNotification(ss.getSheetByName(CONFIG.SHEET_CONFIG), bookingRef, canonical, due.replyDueAt);
    }
    return created(bookingRef, Boolean(found));
  } finally {
    lock.releaseLock();
  }
}

function handleGetBySubmissionId(rawPayload) {
  var parsed;
  try {
    parsed = JSON.parse(rawPayload);
  } catch (e) {
    return errorCode('VALIDATION');
  }
  var submissionId = parsed && (parsed.submissionId || (parsed.booking && parsed.booking.submissionId));
  if (typeof submissionId !== 'string' || !UUID_V4.test(submissionId.trim())) return errorCode('VALIDATION');
  submissionId = submissionId.trim().toLowerCase();

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_BOOKINGS);
  if (!sheet) return errorCode('INTERNAL');
  var values = sheet.getDataRange().getValues();
  if (!values || values.length === 0) return jsonResponse({ ok: true, data: { row: null } });
  var found = findSubmission(values, submissionId);
  if (!found) return jsonResponse({ ok: true, data: { row: null } });
  if ((found.state !== 'IN_PROGRESS' && found.state !== 'COMMITTED' && found.state !== 'ABANDONED') || !BOOKING_REF.test(found.bookingRef) || !found.bodyHash) {
    return errorCode('INTERNAL');
  }
  return jsonResponse({
    ok: true,
    data: {
      row: {
        idempotencyState: found.state,
        bodyHash: found.bodyHash,
        bookingRef: found.bookingRef,
        rulesCheckedAt: found.rulesCheckedAt
      }
    }
  });
}

function honeypot(req) {
  if (!req || req.website == null) return false;
  if (typeof req.website !== 'string') return true;
  return req.website.trim() !== '';
}

function canonicalBooking(raw) {
  return {
    submissionId: typeof raw.submissionId === 'string' ? raw.submissionId.trim().toLowerCase() : '',
    adults: raw.adults,
    alternateDate: blank(raw.alternateDate) ? null : raw.alternateDate,
    alternateStartTime: blank(raw.alternateStartTime) ? null : raw.alternateStartTime,
    areas: raw.areas == null ? [] : raw.areas,
    children: raw.children == null || raw.children === '' ? 0 : raw.children,
    consent: raw.consent,
    country: blank(raw.country) ? null : (typeof raw.country === 'string' ? raw.country.trim() : raw.country),
    date: raw.date,
    durationMinutes: raw.durationMinutes,
    email: typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '',
    experienceId: blank(raw.experienceId) ? null : raw.experienceId,
    interests: raw.interests == null ? [] : raw.interests,
    locale: raw.locale,
    name: typeof raw.name === 'string' ? raw.name.trim() : '',
    notes: blank(raw.notes) ? null : (typeof raw.notes === 'string' ? raw.notes.trim() : raw.notes),
    phone: blank(raw.phone) ? null : (typeof raw.phone === 'string' ? raw.phone.trim() : raw.phone),
    planId: blank(raw.planId) ? null : raw.planId,
    productType: raw.productType,
    startTime: raw.startTime
  };
}

function validateCanonical(booking, raw) {
  if (booking.productType === 'ready_made') return 'BOOKING_CLOSED';
  if (booking.productType !== 'private_guide') return 'VALIDATION';
  if (!UUID_V4.test(booking.submissionId)) return 'VALIDATION';
  if (booking.experienceId != null || booking.planId != null) return 'VALIDATION';
  if (!LOCALES[booking.locale]) return 'VALIDATION';
  if (!isRealDate(booking.date)) return 'VALIDATION';
  if (!START_TIMES[booking.startTime]) return 'VALIDATION';
  if (!DURATIONS[booking.durationMinutes]) return 'VALIDATION';
  if ((blank(raw.alternateDate) && !blank(raw.alternateStartTime)) || (!blank(raw.alternateDate) && blank(raw.alternateStartTime))) return 'VALIDATION';
  if (booking.alternateDate != null && (!isRealDate(booking.alternateDate) || !START_TIMES[booking.alternateStartTime])) return 'VALIDATION';
  if (!isInteger(booking.adults) || booking.adults < 1) return 'VALIDATION';
  if (!isInteger(booking.children) || booking.children < 0) return 'VALIDATION';
  if (booking.adults + booking.children > 6) return 'VALIDATION';
  if (!isEnumList(booking.areas, AREAS) || !isEnumList(booking.interests, INTERESTS)) return 'VALIDATION';
  if (!booking.name || booking.name.length > 100) return 'VALIDATION';
  if (!booking.email || booking.email.length > 254 || !EMAIL.test(booking.email)) return 'VALIDATION';
  if (booking.phone != null && (typeof booking.phone !== 'string' || booking.phone.length > 30 || !PHONE.test(booking.phone))) return 'VALIDATION';
  if (booking.country != null && (typeof booking.country !== 'string' || booking.country.length > 60)) return 'VALIDATION';
  if (booking.notes != null && (typeof booking.notes !== 'string' || booking.notes.length > 2000)) return 'VALIDATION';
  if (booking.consent !== true) return 'VALIDATION';
  if (raw.amount != null || raw.price != null || raw.currency != null) return 'VALIDATION';

  var primary = slotProblem(booking.date, booking.startTime, booking.durationMinutes);
  if (primary) return primary;
  if (booking.alternateDate != null) {
    var alternate = slotProblem(booking.alternateDate, booking.alternateStartTime, booking.durationMinutes);
    if (alternate) return alternate;
    if (booking.alternateDate === booking.date && booking.alternateStartTime === booking.startTime) return 'SAME_CHOICE';
  }
  return '';
}

function slotProblem(date, time, duration) {
  var start = time.split(':');
  var end = Number(start[0]) * 60 + Number(start[1]) + duration;
  if (end > 20 * 60) return 'ENDS_AFTER_CLOSE';
  var now = Date.now();
  var receipt = tokyoDate(now);
  if (date < receipt) return 'TOO_SOON';
  if (date > addCalendarDays(receipt, 90)) return 'TOO_FAR';
  var instant = Date.parse(date + 'T' + time + ':00+09:00');
  if (isNaN(instant) || instant < now + 48 * 60 * 60 * 1000) return 'TOO_SOON';
  return '';
}

function hashCanonical(booking) {
  var payload = {
    adults: booking.adults,
    alternateDate: booking.alternateDate,
    alternateStartTime: booking.alternateStartTime,
    areas: booking.areas,
    children: booking.children,
    consent: booking.consent,
    country: booking.country,
    date: booking.date,
    durationMinutes: booking.durationMinutes,
    email: booking.email,
    experienceId: booking.experienceId,
    interests: booking.interests,
    locale: booking.locale,
    name: booking.name,
    notes: booking.notes,
    phone: booking.phone,
    planId: booking.planId,
    productType: booking.productType,
    startTime: booking.startTime
  };
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(payload), Utilities.Charset.UTF_8);
  return bytes.map(function (byte) { return ('0' + (byte & 0xFF).toString(16)).slice(-2); }).join('');
}

function bookingRecord(booking, bookingRef, bodyHash, createdAt, rulesCheckedAt, due) {
  return {
    booking_ref: sanitizeCellValue(bookingRef),
    submission_id: sanitizeCellValue(booking.submissionId),
    body_hash: bodyHash,
    idempotency_state: 'IN_PROGRESS',
    rules_checked_at: rulesCheckedAt,
    created_at: createdAt,
    source: CONFIG.SOURCE,
    locale: booking.locale,
    product_type: booking.productType,
    experience_id: '',
    plan_id: '',
    date: booking.date,
    start_time: booking.startTime,
    duration_minutes: booking.durationMinutes,
    alternate_date: booking.alternateDate || '',
    alternate_start_time: booking.alternateStartTime || '',
    adults: booking.adults,
    children: booking.children,
    traveler_name: sanitizeCellValue(booking.name),
    email: sanitizeCellValue(booking.email),
    phone: sanitizeCellValue(booking.phone || ''),
    country: sanitizeCellValue(booking.country || ''),
    areas: sanitizeCellValue(booking.areas.join(', ')),
    interests: sanitizeCellValue(booking.interests.join(', ')),
    notes: sanitizeCellValue(booking.notes || ''),
    consent_at: rulesCheckedAt,
    status: '',
    chosen_slot: '',
    quoted_amount_jpy: '',
    currency: CONFIG.CURRENCY,
    quote_sent_at: '',
    guide_hold: 'none',
    guide_hold_until: '',
    guide_hold_note: '',
    stripe_invoice_id: '',
    stripe_invoice_url: '',
    stripe_invoice_status: 'none',
    stripe_checked_at: '',
    invoice_issued_at: '',
    pay_by: '',
    pay_window_elapsed_at: '',
    paid_at: '',
    late_payment: false,
    exception_reason: '',
    confirmed_at: '',
    stripe_refund_id: '',
    refund_status: 'not_required',
    reply_due_at: due.replyDueAt,
    reply_due_basis: due.replyDueBasis,
    admin_note: '',
    updated_at: rulesCheckedAt
  };
}

// Read-only check. The header row is never written by this script.
function bookingHeadersMatch(sheet) {
  if (sheet.getLastRow() < 1) return false;
  var width = Math.max(sheet.getLastColumn(), BOOKING_HEADERS.length);
  var current = sheet.getRange(1, 1, 1, width).getValues()[0].map(function (value) {
    return String(value || '').trim();
  });
  var same = BOOKING_HEADERS.every(function (name, index) { return current[index] === name; });
  var extra = current.slice(BOOKING_HEADERS.length).some(function (name) { return name !== ''; });
  return same && !extra;
}

function findSubmission(values, submissionId) {
  if (!values || values.length < 2) return null;
  var headers = values[0].map(function (value) { return String(value || '').trim(); });
  var idCol = headers.indexOf('submission_id');
  if (idCol === -1) return null;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idCol] || '').trim().toLowerCase() === submissionId) {
      return {
        rowNumber: i + 1,
        state: String(columnValue(values[i], headers, 'idempotency_state') || ''),
        bodyHash: String(columnValue(values[i], headers, 'body_hash') || ''),
        bookingRef: String(columnValue(values[i], headers, 'booking_ref') || ''),
        createdAt: columnText(columnValue(values[i], headers, 'created_at')),
        status: String(columnValue(values[i], headers, 'status') || ''),
        rulesCheckedAt: timeMs(columnValue(values[i], headers, 'rules_checked_at'))
      };
    }
  }
  return null;
}

function writeBookingRow(sheet, rowNumber, record) {
  var row = BOOKING_HEADERS.map(function (key) {
    var value = record[key];
    return value == null ? '' : value;
  });
  sheet.getRange(rowNumber, 1, 1, BOOKING_HEADERS.length).setValues([row]);
}

function columnValue(row, headers, name) {
  var index = headers.indexOf(name);
  return index === -1 ? '' : row[index];
}

function columnText(value) {
  if (value instanceof Date) return value.toISOString();
  return value ? String(value) : '';
}

function timeMs(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number' && isFinite(value)) return value;
  if (!value) return null;
  var ms = new Date(value).getTime();
  return isNaN(ms) ? null : ms;
}

function created(bookingRef, replayed) {
  return jsonResponse({ ok: true, data: { bookingRef: bookingRef, replayed: replayed } });
}

function errorCode(code) {
  return jsonResponse({ ok: false, error: { code: code } });
}

function blank(value) {
  return value == null || (typeof value === 'string' && value.trim() === '');
}

function isInteger(value) {
  return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
}

function isRealDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  var parts = value.split('-').map(Number);
  var utc = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  return utc.getUTCFullYear() === parts[0] && utc.getUTCMonth() === parts[1] - 1 && utc.getUTCDate() === parts[2];
}

function isEnumList(value, allowed) {
  if (!Array.isArray(value)) return false;
  var seen = {};
  for (var i = 0; i < value.length; i++) {
    if (typeof value[i] !== 'string' || !allowed[value[i]] || seen[value[i]]) return false;
    seen[value[i]] = true;
  }
  return true;
}

function tokyoDate(nowMs) {
  return Utilities.formatDate(new Date(nowMs), 'Asia/Tokyo', 'yyyy-MM-dd');
}

function addCalendarDays(isoDate, days) {
  var parts = isoDate.split('-').map(Number);
  var utc = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + days));
  var month = String(utc.getUTCMonth() + 1);
  var day = String(utc.getUTCDate());
  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  return utc.getUTCFullYear() + '-' + month + '-' + day;
}

function generateBookingRef() {
  return generateRef('CR');
}

function generateRef(prefix) {
  var ymd = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd');
  var chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  var rand = '';
  for (var i = 0; i < 6; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
  return prefix + '-' + ymd + '-' + rand;
}

function sanitizeCellValue(val) {
  if (typeof val !== 'string') return val;
  if (/^[=\+\-@\t\r]/.test(val)) return "'" + val;
  return val;
}

function calculateReplyDueAt(receivedAtUtc, holidaysList) {
  var receivedJst = new Date(receivedAtUtc.getTime() + 9 * 3600 * 1000);
  var current = new Date(receivedJst);
  current.setUTCDate(current.getUTCDate() + 1);

  var holidaySet = {};
  var validHolidaysCount = 0;
  if (Array.isArray(holidaysList)) {
    for (var h = 0; h < holidaysList.length; h++) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(holidaysList[h])) {
        holidaySet[holidaysList[h]] = true;
        validHolidaysCount++;
      }
    }
  }

  var businessDaysCount = 0;
  while (businessDaysCount < 2) {
    var dayOfWeek = current.getUTCDay();
    var month = String(current.getUTCMonth() + 1);
    var day = String(current.getUTCDate());
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    var dateStr = current.getUTCFullYear() + '-' + month + '-' + day;
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet[dateStr]) {
      businessDaysCount++;
      if (businessDaysCount === 2) break;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  var dueMonth = String(current.getUTCMonth() + 1);
  var dueDay = String(current.getUTCDate());
  if (dueMonth.length < 2) dueMonth = '0' + dueMonth;
  if (dueDay.length < 2) dueDay = '0' + dueDay;
  var targetDateStr = current.getUTCFullYear() + '-' + dueMonth + '-' + dueDay;
  return {
    replyDueAt: new Date(targetDateStr + 'T09:00:00Z').toISOString(),
    replyDueBasis: validHolidaysCount > 0 ? 'weekends_and_holidays' : 'weekends_only'
  };
}

function getHolidaysList(configSheet) {
  if (!configSheet) return [];
  var data = configSheet.getDataRange().getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === 'holiday_dates') return String(data[i][1] || '').split('\n').map(function (item) { return item.trim(); }).filter(Boolean);
  }
  return [];
}

/**
 * inquiries.create: payload { inquiry, bodyHash }. The website validated the
 * fields; they are checked again here. A repeat of the same submission id with
 * the same body returns the stored reference (replayed: true); a different
 * body is DUPLICATE_CONFLICT. Status starts at NEW.
 */
function handleInquiryCreate(rawPayload) {
  var parsed;
  try {
    parsed = JSON.parse(rawPayload);
  } catch (e) {
    return errorCode('VALIDATION');
  }
  if (!parsed || typeof parsed !== 'object' || !parsed.inquiry || typeof parsed.inquiry !== 'object' || Array.isArray(parsed.inquiry)) return errorCode('VALIDATION');
  if (typeof parsed.bodyHash !== 'string' || !/^[0-9a-f]{64}$/.test(parsed.bodyHash)) return errorCode('VALIDATION');
  var q = parsed.inquiry;
  if (inquiryInvalid(q)) return errorCode('VALIDATION');
  var submissionId = q.submissionId.toLowerCase();

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(CONFIG.LOCK_TIMEOUT_MS)) return errorCode('INTERNAL');
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_INQUIRIES);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_INQUIRIES);
      sheet.getRange(1, 1, 1, INQUIRY_HEADERS.length).setValues([INQUIRY_HEADERS]);
      sheet.setFrozenRows(1);
    }
    var head = sheet.getRange(1, 1, 1, INQUIRY_HEADERS.length).getValues()[0];
    for (var h = 0; h < INQUIRY_HEADERS.length; h++) {
      if (String(head[h] || '').trim() !== INQUIRY_HEADERS[h]) return errorCode('SHEET_HEADER_MISMATCH');
    }

    var values = sheet.getDataRange().getValues();
    for (var r = 1; r < values.length; r++) {
      if (String(values[r][1] || '').trim().toLowerCase() !== submissionId) continue;
      if (String(values[r][2] || '') !== parsed.bodyHash) return errorCode('DUPLICATE_CONFLICT');
      var existing = String(values[r][0] || '');
      if (!INQUIRY_REF.test(existing)) return errorCode('INTERNAL');
      return jsonResponse({ ok: true, data: { inquiryRef: existing, replayed: true } });
    }

    var now = new Date().toISOString();
    var ref = generateRef('CQ');
    var record = {
      inquiry_ref: ref,
      submission_id: submissionId,
      body_hash: parsed.bodyHash,
      created_at: now,
      source: CONFIG.SOURCE,
      kind: 'private_guide',
      name: q.name,
      email: q.email,
      preferred_date: q.preferredDate || '',
      adults: q.adults == null ? '' : q.adults,
      children: q.children == null ? '' : q.children,
      destinations: q.destinations.join(', '),
      activities: q.activities.join(', '),
      places_to_visit: q.placesToVisit || '',
      ideal_day: q.idealDay || '',
      notes: q.notes || '',
      status: 'NEW',
      admin_note: '',
      updated_at: now
    };
    sheet.appendRow(INQUIRY_HEADERS.map(function (key) { return sanitizeCellValue(record[key]); }));
    logStatus(ss, ref, 'NONE', 'NEW', 'inquiries.create', 'system', 'Inquiry stored');
    sendAdminInquiryNotification(ss.getSheetByName(CONFIG.SHEET_CONFIG), ref);
    return jsonResponse({ ok: true, data: { inquiryRef: ref, replayed: false } });
  } finally {
    lock.releaseLock();
  }
}

function inquiryInvalid(q) {
  if (typeof q.submissionId !== 'string' || !UUID_V4.test(q.submissionId)) return true;
  if (q.kind !== 'private_guide') return true;
  if (typeof q.name !== 'string' || blank(q.name) || q.name.length > 100) return true;
  if (typeof q.email !== 'string' || q.email.length > 254 || !EMAIL.test(q.email)) return true;
  if (q.preferredDate != null && !isRealDate(q.preferredDate)) return true;
  var counts = [q.adults, q.children];
  for (var i = 0; i < counts.length; i++) {
    if (counts[i] != null && (!isInteger(counts[i]) || counts[i] < 0 || counts[i] > 50)) return true;
  }
  if (!isEnumList(q.destinations, AREAS) || !isEnumList(q.activities, INTERESTS)) return true;
  var texts = [q.placesToVisit, q.idealDay, q.notes];
  for (var t = 0; t < texts.length; t++) {
    if (texts[t] != null && (typeof texts[t] !== 'string' || texts[t].length > 2000)) return true;
  }
  return false;
}

/** Short notice without personal data, like the booking one. The website sends the full email. */
function sendAdminInquiryNotification(configSheet, inquiryRef) {
  if (!configSheet) return;
  var data = configSheet.getDataRange().getValues();
  var emails = '';
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === 'admin_notification_emails') {
      emails = String(data[i][1] || '').trim();
      break;
    }
  }
  if (!emails || /^(disabled|none|off)$/i.test(emails)) return;
  try {
    MailApp.sendEmail({
      to: emails,
      subject: '[Connectrip] 新規お問い合わせ受付 (' + inquiryRef + ')',
      body: '新規お問い合わせを受け付けました。\n\n受付番号: ' + inquiryRef + '\n\n個人情報はメールに記載していません。管理スプレッドシート（Inquiries）で確認してください。\n'
    });
  } catch (e) {
    console.error('admin inquiry notification failed');
  }
}

function logStatus(ss, bookingRef, fromStatus, toStatus, action, actor, note) {
  var logSheet = ss.getSheetByName(CONFIG.SHEET_STATUS_LOG);
  if (!logSheet) return;
  logSheet.appendRow([new Date().toISOString(), bookingRef, fromStatus, toStatus, action, actor, note || '']);
}

function sendAdminNotification(configSheet, bookingRef, booking, replyDueAt) {
  if (!configSheet) return;
  var data = configSheet.getDataRange().getValues();
  var emails = '';
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === 'admin_notification_emails') {
      emails = String(data[i][1] || '').trim();
      break;
    }
  }
  if (!emails || emails.toLowerCase() === 'disabled' || emails.toLowerCase() === 'none' || emails.toLowerCase() === 'off') return;

  var alternate = booking.alternateDate ? booking.alternateDate + ' ' + booking.alternateStartTime : '(なし)';
  var body = '新規予約リクエストを受け付けました。\n\n'
    + '予約番号: ' + bookingRef + '\n'
    + 'プラン種別: ' + booking.productType + '\n'
    + '所要時間: ' + booking.durationMinutes + '分\n'
    + '人数: 大人 ' + booking.adults + '名 / 子ども ' + booking.children + '名\n'
    + '第1希望日時: ' + booking.date + ' ' + booking.startTime + '\n'
    + '第2希望日時: ' + alternate + '\n'
    + '回答目標期限: ' + replyDueAt + ' (UTC)\n\n'
    + '個人情報はメールに記載していません。管理スプレッドシートで確認してください。\n';
  try {
    MailApp.sendEmail({ to: emails, subject: '[Connectrip] 新規予約リクエスト受付 (' + bookingRef + ')', body: body });
  } catch (e) {
    console.error('admin notification failed');
  }
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  var result = 0;
  for (var i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function computeHmacSha256Base64Url(secret, message) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(message, secret)).replace(/=+$/, '');
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function onEditRevertProtectedCells(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  if (sheet.getName() !== CONFIG.SHEET_BOOKINGS) return;
  var row = e.range.getRow();
  var col = e.range.getColumn();
  if (row <= 1) return;
  var header = String(sheet.getRange(1, col).getValue() || '').trim();
  if (!PROTECTED_HEADERS[header]) return;
  e.range.setValue(e.oldValue !== undefined ? e.oldValue : '');
  logStatus(sheet.getParent(), sheet.getRange(row, 1).getValue(), e.oldValue, e.value, 'direct_edit_revert', e.user ? e.user.getEmail() : 'unknown', 'Direct cell edit reverted');
}
