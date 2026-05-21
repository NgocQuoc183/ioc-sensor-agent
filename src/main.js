require('dotenv').config();

const { readSHT31 } = require('./sensors/sht31');
const { readDS18B20 } = require('./sensors/ds18b20');
const { readPH } = require('./sensors/ph');
const { readDO } = require('./sensors/do');
const { readTDS } = require('./sensors/tds');
const { sendBatch } = require('./api');

const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '60000', 10);
const SHT31_ADDRESS = parseInt(process.env.SHT31_ADDRESS || '0x44', 16);
const ADS1115_ADDRESS = parseInt(process.env.ADS1115_ADDRESS || '0x48', 16);
const I2C_BUS = parseInt(process.env.I2C_BUS || '1', 10);
const PH_OFFSET = parseFloat(process.env.PH_CALIBRATION_OFFSET || '0');
const PH_SLOPE = parseFloat(process.env.PH_CALIBRATION_SLOPE || '1');
const TDS_TEMPERATURE = parseFloat(process.env.TDS_TEMPERATURE || '25');

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}
const observations = [];
async function collectAndSendSHT31() {
  log('Bắt đầu đọc cảm biến...');
  // const observations = [];

  // SHT31 — nhiệt độ và độ ẩm ngoài trời
  try {
    const { temperature, humidity } = await readSHT31(SHT31_ADDRESS, I2C_BUS);
    log(`SHT31 → Nhiệt độ: ${temperature}°C, Độ ẩm: ${humidity}%`);
    observations.push({ parameterCode: 'temperature', valueNumeric: temperature, unit: 'degC' });
    observations.push({ parameterCode: 'humidity', valueNumeric: humidity, unit: 'percent' });
  } catch (err) {
    log(`[WARN] SHT31 lỗi: ${err.message}`);
  }
}
async function collectAndSendDS18B20() {
  // DS18B20 — nhiệt độ nước
  try {
    const { waterTemperature } = await readDS18B20();
    log(`DS18B20 → Nhiệt độ nước: ${waterTemperature}°C`);
    observations.push({ parameterCode: 'waterTemperature', valueNumeric: waterTemperature, unit: 'degC' });
  } catch (err) {
    log(`[WARN] DS18B20 lỗi: ${err.message}`);
  }
}
async function collectAndSendpH() {
  // pH
  try {
    const { ph } = await readPH(ADS1115_ADDRESS, I2C_BUS, PH_OFFSET, PH_SLOPE);
    log(`pH → ${ph}`);
    observations.push({ parameterCode: 'ph', valueNumeric: ph, unit: 'pH' });
  } catch (err) {
    log(`[WARN] pH lỗi: ${err.message}`);
  }
}
async function collectAndSendDO() {
  // DO
  try {
    const { dissolvedOxygen } = await readDO(ADS1115_ADDRESS, I2C_BUS);
    log(`DO → ${dissolvedOxygen} mg/L`);
    observations.push({ parameterCode: 'dissolvedOxygen', valueNumeric: dissolvedOxygen, unit: 'mgL' });
  } catch (err) {
    log(`[WARN] DO lỗi: ${err.message}`);
  }
}
async function collectAndSendTDS() {
  // TDS
  try {
    const { tds } = await readTDS(ADS1115_ADDRESS, I2C_BUS, TDS_TEMPERATURE);
    log(`TDS → ${tds} ppm`);
    observations.push({ parameterCode: 'tds', valueNumeric: tds, unit: 'ppm' });
  } catch (err) {
    log(`[WARN] TDS lỗi: ${err.message}`);
  }
}
async function sendData() {
  // collectAndSendSHT31();
  // collectAndSendDS18B20();
  // collectAndSendpH();
  // collectAndSendDO();
  await collectAndSendTDS();

  // if (observations.length === 0) {
  //   log('[WARN] Không có dữ liệu để gửi');
  //   return;
  // }

  // Gửi batch lên server
  // try {
  //   const res = await sendBatch(observations);
  //   log(`Gửi thành công: ${observations.length} chỉ số. Response: ${JSON.stringify(res)}`);
  // } catch (err) {
  //   log(`[ERROR] Gửi dữ liệu thất bại: ${err.message}`);
  // }
}
// Chạy ngay lần đầu, sau đó lặp theo chu kỳ
sendData();
// setInterval(sendData, POLL_INTERVAL_MS);

log(`Ứng dụng khởi động. Chu kỳ gửi: ${POLL_INTERVAL_MS / 1000}s`);
