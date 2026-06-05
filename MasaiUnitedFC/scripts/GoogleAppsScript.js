/**
 * MASAI UNITED FC — Google Apps Script
 *
 * HOW TO SET UP:
 * 1. Open your Google Form → click 3-dot menu → "Script editor"
 * 2. Paste this entire file into the editor
 * 3. Replace FIREBASE_PROJECT_ID and FIREBASE_WEB_API_KEY below
 * 4. Save → Run → Authorize permissions
 * 5. Set trigger: "onFormSubmit" → From spreadsheet → On form submit
 *
 * GOOGLE FORM FIELDS (create in this exact order):
 *  1.  Request Type                (Multiple choice: "New Registration" / "Update Details")
 *  2.  Player Full Name            (Short answer)
 *  3.  Date of Birth               (Short answer — format: YYYY-MM-DD)
 *  4.  Category                    (Dropdown: U8 / U10 / U12 / U15 / U18)
 *  5.  Position                    (Dropdown: Goalkeeper / Defender / Midfielder / Forward / Winger)
 *  6.  Jersey Number               (Short answer — number)
 *  7.  School Name                 (Short answer)
 *  8.  Parent / Guardian Name      (Short answer)
 *  9.  Parent WhatsApp Number      (Short answer — e.g. +60123456789)
 *  10. Parent Email                (Short answer)
 *  11. Home Address                (Paragraph)
 *  12. Emergency Contact Name      (Short answer)
 *  13. Emergency Contact Phone     (Short answer)
 *  14. Medical / Special Notes     (Paragraph)
 *  15. Monthly Fee Agreed (RM)     (Short answer — number)
 *  16. Existing Player ID          (Short answer — for updates only, leave blank for new)
 */

// ─── CONFIGURATION — update these values ────────────────────────────────────
var FIREBASE_PROJECT_ID = 'YOUR_FIREBASE_PROJECT_ID';   // e.g. masai-united-fc
var FIREBASE_API_KEY    = 'YOUR_FIREBASE_WEB_API_KEY';  // from Firebase console > Project Settings
var ADMIN_EMAIL         = 'admin@masaiunitedfc.com';    // admin gets email on new submission
var CLUB_WHATSAPP       = '+601XXXXXXXXX';              // club admin WhatsApp for notifications
// ────────────────────────────────────────────────────────────────────────────

/**
 * Main trigger — fires on every Google Form submission.
 * Go to: Triggers (clock icon) → Add Trigger → onFormSubmit → On form submit
 */
function onFormSubmit(e) {
  try {
    var values = e.values; // array of column values from the linked Sheet
    var timestamp = values[0];

    var requestType    = values[1]  || 'New Registration';
    var playerName     = values[2]  || '';
    var dob            = values[3]  || '';
    var category       = values[4]  || '';
    var position       = values[5]  || '';
    var jerseyNumber   = values[6]  || '';
    var school         = values[7]  || '';
    var parentName     = values[8]  || '';
    var parentPhone    = values[9]  || '';
    var parentEmail    = values[10] || '';
    var address        = values[11] || '';
    var emergencyName  = values[12] || '';
    var emergencyPhone = values[13] || '';
    var medicalNotes   = values[14] || '';
    var monthlyFee     = values[15] || '0';
    var existingId     = values[16] || '';

    var isUpdate = requestType === 'Update Details' && existingId.trim() !== '';
    var collectionPath = isUpdate ? 'updateRequests' : 'pendingPlayers';

    var payload = {
      fields: {
        requestType:    { stringValue: requestType },
        playerName:     { stringValue: playerName },
        dob:            { stringValue: dob },
        category:       { stringValue: category },
        position:       { stringValue: position },
        jerseyNumber:   { stringValue: jerseyNumber },
        school:         { stringValue: school },
        parentName:     { stringValue: parentName },
        parentPhone:    { stringValue: sanitizePhone_(parentPhone) },
        parentEmail:    { stringValue: parentEmail },
        address:        { stringValue: address },
        emergencyContact: { stringValue: emergencyName },
        emergencyPhone: { stringValue: emergencyPhone },
        medicalNotes:   { stringValue: medicalNotes },
        monthlyFee:     { doubleValue: parseFloat(monthlyFee) || 0 },
        existingPlayerId: { stringValue: existingId },
        status:         { stringValue: 'pending' },
        source:         { stringValue: 'google_form' },
        submittedAt:    { stringValue: timestamp },
        createdAt:      { stringValue: new Date().toISOString() },
      }
    };

    // Write to Firestore via REST API
    var url = 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT_ID +
              '/databases/(default)/documents/' + collectionPath + '?key=' + FIREBASE_API_KEY;

    var options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();

    if (responseCode === 200 || responseCode === 201) {
      Logger.log('SUCCESS: ' + playerName + ' written to ' + collectionPath);
      notifyAdminByEmail_(playerName, parentName, parentEmail, requestType);
      markRowAsProcessed_(e.range.getRow(), 'Sent to App ✅');
    } else {
      Logger.log('ERROR ' + responseCode + ': ' + response.getContentText());
      markRowAsProcessed_(e.range.getRow(), 'Error ❌ ' + responseCode);
      notifyAdminOfError_(playerName, response.getContentText());
    }

  } catch (err) {
    Logger.log('EXCEPTION: ' + err.toString());
    markRowAsProcessed_(e.range.getRow(), 'Exception ❌');
  }
}

/**
 * Normalise phone to +60 format
 */
function sanitizePhone_(phone) {
  phone = phone.replace(/[^0-9+]/g, '');
  if (phone.startsWith('0')) phone = '+60' + phone.slice(1);
  if (!phone.startsWith('+')) phone = '+60' + phone;
  return phone;
}

/**
 * Write status back to the Sheet so you can track submissions
 */
function markRowAsProcessed_(row, statusText) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  // Write to the column AFTER the last form field (column 18 = column R)
  sheet.getRange(row, 18).setValue(statusText);
  sheet.getRange(row, 18).setBackground(
    statusText.includes('✅') ? '#c6efce' : '#ffc7ce'
  );
}

/**
 * Send email to admin when new submission arrives
 */
function notifyAdminByEmail_(playerName, parentName, parentEmail, requestType) {
  var subject = '⚽ MUFC App — ' + requestType + ': ' + playerName;
  var body = 'A new ' + requestType + ' has been submitted via Google Form.\n\n' +
             'Player: ' + playerName + '\n' +
             'Parent: ' + parentName + ' (' + parentEmail + ')\n\n' +
             'Please open the MUFC Admin app → Players → Pending Approvals to review.\n\n' +
             '— Masai United FC System';
  MailApp.sendEmail(ADMIN_EMAIL, subject, body);
}

/**
 * Notify admin if Firestore write fails
 */
function notifyAdminOfError_(playerName, errorText) {
  var subject = '❌ MUFC — Form submission failed for ' + playerName;
  var body = 'A Google Form submission failed to reach Firebase.\n\n' +
             'Player: ' + playerName + '\n' +
             'Error: ' + errorText + '\n\n' +
             'Please check the Google Sheet and re-submit manually.';
  MailApp.sendEmail(ADMIN_EMAIL, subject, body);
}

/**
 * Run this ONCE manually to test the connection to Firebase.
 * Go to Run → testFirebaseConnection
 */
function testFirebaseConnection() {
  var url = 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT_ID +
            '/databases/(default)/documents/pendingPlayers?key=' + FIREBASE_API_KEY;
  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  Logger.log('Status: ' + response.getResponseCode());
  Logger.log('Body: ' + response.getContentText().substring(0, 300));
}

/**
 * Manually re-process a specific row (useful if a row failed).
 * Change ROW_NUMBER and run manually.
 */
function reprocessRow() {
  var ROW_NUMBER = 2; // ← change this to the row you want to reprocess
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var values = sheet.getRange(ROW_NUMBER, 1, 1, 17).getValues()[0];
  onFormSubmit({ values: values, range: sheet.getRange(ROW_NUMBER, 1) });
}
