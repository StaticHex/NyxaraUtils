const fs = require('fs').promises;
const path = require('path');

const filePath = path.resolve(__dirname, '../botstatus/persist.json');

async function readData() {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Failed to read persist.json:', err);
    }
    return {};
  }
}

async function writeData(data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to write persist.json:', err);
  }
}

async function get(key) {
  const data = await readData();
  return data[key];
}

async function set(key, value) {
  const data = await readData();
  data[key] = value;
  await writeData(data);
}

module.exports = { get, set };
