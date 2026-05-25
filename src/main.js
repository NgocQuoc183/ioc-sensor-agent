require('dotenv').config();

const { readSHT31 } = require('./sensors/sht31');
const { readDS18B20 } = require('./sensors/ds18b20');
const { readPH } = require('./sensors/ph');
const { readDO } = require('./sensors/do');
const { readTDS } = require('./sensors/tds');
const { sendObservation, sendBatch } = require('./api');

const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '2000', 10);
const SHT31_ADDRESS = parseInt(process.env.SHT31_ADDRESS || '0x44', 16);
const ADS1115_ADDRESS = parseInt(process.env.ADS1115_ADDRESS || '0x48', 16);
const I2C_BUS = parseInt(process.env.I2C_BUS || '1', 10);
const PH_OFFSET = parseFloat(process.env.PH_CALIBRATION_OFFSET || '0');
const PH_SLOPE = parseFloat(process.env.PH_CALIBRATION_SLOPE || '1');
const TDS_TEMPERATURE = parseFloat(process.env.TDS_TEMPERATURE || '25');
const SHT31_DEVICE_ID = process.env.SHT31_DEVICE_ID || process.env.DEVICE_ID;
const DS18B20_DEVICE_ID = process.env.DS18B20_DEVICE_ID || process.env.DEVICE_ID;
const PH_DEVICE_ID = process.env.PH_DEVICE_ID || process.env.DEVICE_ID;
const DO_DEVICE_ID = process.env.DO_DEVICE_ID || process.env.DEVICE_ID;
const TDS_DEVICE_ID = process.env.TDS_DEVICE_ID || process.env.DEVICE_ID;

function log(msg) {
  const now = new Date();
  console.log(`[${new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().replace('Z', '+07:00')}] ${msg}`);
}


async function sendSensorObservations(sensorName, deviceId, observations) {
  if (observations.length === 0) {
    log(`[WARN] ${sensorName}: Không có dữ liệu để gửi`);
    return;
  }
  // Nếu cảm biến chỉ có 1 giá trị thì gửi bằng sendObservation.
  // Nếu cảm biến có 2 giá trị thì gửi bằng sendBatch.
  try {
    if (observations.length === 1) {
      const { parameterCode, valueNumeric, unit } = observations[0];
      // const res = await sendObservation(deviceId, parameterCode, valueNumeric, unit);
      log(`${sensorName}: Gửi thành công 1 chỉ số. Response: ${JSON.stringify(res)}`);
      log(`${sensorName}: Gửi thành công 1 chỉ số. Response: { deviceId: ${deviceId}, parameterCode: ${parameterCode}, valueNumeric: ${valueNumeric}, unit: ${unit} }`);

      return;
    }
    // const res = await sendBatch(deviceId, observations);
    log(`${sensorName}: Gửi batch thành công ${observations.length} chỉ số. Response: ${JSON.stringify(res)}`);
    log(`${sensorName}: Gửi batch thành công ${observations.length} chỉ số. Response: { deviceId: ${deviceId}, observations: ${JSON.stringify(observations)} }`);
  } catch (err) {
    log(`[ERROR] ${sensorName}: Gửi dữ liệu thất bại: ${err.message}`);
  }
}

async function collectSHT31() {
  const observations = [];

  // SHT31 — nhiệt độ và độ ẩm ngoài trời
  try {
    const { temperature, humidity } = await readSHT31(SHT31_ADDRESS, I2C_BUS);
    log(`SHT31 → Nhiệt độ: ${temperature}°C, Độ ẩm: ${humidity}%`);
    observations.push({ parameterCode: 'temperature', valueNumeric: temperature, unit: 'degC' });
    observations.push({ parameterCode: 'humidity', valueNumeric: humidity, unit: 'percent' });
  } catch (err) {
    log(`[WARN] SHT31 lỗi: ${err.message}`);
  }

  return observations;
}

async function collectDS18B20() {
  const observations = [];

  // DS18B20 — nhiệt độ nước
  try {
    const { waterTemperature } = await readDS18B20();
    log(`DS18B20 → Nhiệt độ nước: ${waterTemperature}°C`);
    observations.push({ parameterCode: 'nhietdo', valueNumeric: waterTemperature, unit: 'degC' });
  } catch (err) {
    log(`[WARN] DS18B20 lỗi: ${err.message}`);
  }

  return observations;
}

async function collectPH() {
  const observations = [];

  // pH
  try {
    const { ph } = await readPH(ADS1115_ADDRESS, I2C_BUS, PH_OFFSET, PH_SLOPE);
    log(`pH → ${ph}`);
    observations.push({ parameterCode: 'pH', valueNumeric: ph, unit: 'pH' });
  } catch (error) {
    log(`[WARN] pH lỗi: ${error.message}`);
  }

  return observations;
}

async function collectDO() {
  const observations = [];

  // DO
  try {
    const { dissolvedOxygen } = await readDO(ADS1115_ADDRESS, I2C_BUS);
    log(`DO → ${dissolvedOxygen} mg/L`);
    observations.push({ parameterCode: 'dissolvedOxygen', valueNumeric: dissolvedOxygen, unit: 'mgL' });
  } catch (err) {
    log(`[WARN] DO lỗi: ${err.message}`);
  }

  return observations;
}

async function collectTDS() {
  const observations = [];
  // TDS
  try {
    const { tds } = await readTDS(ADS1115_ADDRESS, I2C_BUS, TDS_TEMPERATURE);
    log(`TDS → ${tds} ppm`);
    observations.push({ parameterCode: 'tds', valueNumeric: tds, unit: 'ppm' });
  } catch (err) {
    log(`[WARN] TDS lỗi: ${err.message}`);
  }

  return observations;
}
async function sendData() {
  log('Bắt đầu đọc cảm biến...');

  const sensorReads = [
    ['SHT31', SHT31_DEVICE_ID, collectSHT31],
    ['DS18B20', DS18B20_DEVICE_ID, collectDS18B20],
    ['pH', PH_DEVICE_ID, collectPH],
    // ['DO', DO_DEVICE_ID, collectDO],
    ['TDS', TDS_DEVICE_ID, collectTDS],
  ];

  for (const [sensorName, deviceId, collect] of sensorReads) {
    const observations = await collect();
    await sendSensorObservations(sensorName, deviceId, observations);
  }
}
// Chạy ngay lần đầu, sau đó lặp theo chu kỳ
sendData();
setInterval(sendData, POLL_INTERVAL_MS);

log(`Ứng dụng khởi động. Chu kỳ gửi: ${POLL_INTERVAL_MS / 1000}s`);
