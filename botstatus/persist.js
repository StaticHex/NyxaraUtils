const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../botstatus/persist.json');

function readData() {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

function writeData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

async function get(key) {
  const data = readData();
  return data[key];
}

async function set(key, value) {
  const data = readData();
  data[key] = value;
  writeData(data);
}

module.exports = { get, set };
