const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');

function ensureLogDir() {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  } catch (e) {
    // ignore
  }
}

function getLogFilePath() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return path.join(LOG_DIR, `${yyyy}-${mm}-${dd}.log`);
}

function writeLog(entry) {
  try {
    ensureLogDir();
    const line = JSON.stringify(entry) + '\n';
    fs.appendFile(getLogFilePath(), line, (err) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to write log:', err);
      }
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Logger error:', e);
  }
}

function logTransaction(action, userId, metadata = {}) {
  const entry = {
    ts: new Date().toISOString(),
    type: 'transaction',
    action,
    userId: userId ? String(userId) : null,
    ...metadata
  };
  writeLog(entry);
}

function logRequest(data) {
  const entry = {
    ts: new Date().toISOString(),
    type: 'request',
    ...data
  };
  writeLog(entry);
}

module.exports = { logTransaction, logRequest };
