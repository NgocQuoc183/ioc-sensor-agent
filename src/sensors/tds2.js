require('dotenv').config();

const Ads1x15 = require('ads1x15');
const { readDS18B20 } = require('./ds18b20');

const ADS1115 = 1;
const DEFAULT_TEMPERATURE = 25.0;

const ADS1115_ADDRESS = parseInt(process.env.ADS1115_ADDRESS || '0x48', 16);
const I2C_BUS = parseInt(process.env.I2C_BUS || '1', 10);
const TDS_CHANNEL = parseInt(process.env.TDS_CHANNEL || '0', 10);
const GAIN = parseInt(process.env.TDS_GAIN || '4096', 10);
const SPS = parseInt(process.env.TDS_SPS || '250', 10);
const SAMPLE_COUNT = parseInt(process.env.TDS_SAMPLE_COUNT || '30', 10);
const SAMPLE_DELAY_MS = parseInt(process.env.TDS_SAMPLE_DELAY_MS || '10', 10);
const READ_INTERVAL_MS = parseInt(process.env.TDS_READ_INTERVAL_MS || '1500', 10);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function calculateTDS(voltage, temperature) {
  const compensationCoefficient = 1.0 + 0.02 * (temperature - 25.0);
  const compensatedVoltage = voltage / compensationCoefficient;

  const tdsValue = (
    133.42 * Math.pow(compensatedVoltage, 3)
    - 255.86 * Math.pow(compensatedVoltage, 2)
    + 857.39 * compensatedVoltage
  ) * 0.5;

  return Math.max(0, parseFloat(tdsValue.toFixed(2)));
}

async function readWaterTemperature() {
  try {
    const { waterTemperature } = await readDS18B20();
    return waterTemperature;
  } catch (err) {
    console.warn(`Cảnh báo: Không đọc được DS18B20 (${err.message}), dùng mặc định ${DEFAULT_TEMPERATURE}°C.`);
    return DEFAULT_TEMPERATURE;
  }
}

async function readAverageVoltage(adc) {
  let sumMv = 0;

  try {
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const mv = await adc.readADCSingleEnded(TDS_CHANNEL, GAIN, SPS);
      if (!Number.isFinite(mv)) {
        throw new Error(`Giá trị ADC không hợp lệ: ${mv}`);
      }

      sumMv += mv;
      await sleep(SAMPLE_DELAY_MS);
    }
  } catch (err) {
    adc.busy = false;
    throw err;
  }

  return (sumMv / SAMPLE_COUNT) / 1000;
}

async function readTDSAndTemperature(adc) {
  const temperature = await readWaterTemperature();
  const voltage = await readAverageVoltage(adc);
  const tds = calculateTDS(voltage, temperature);

  return { temperature, voltage, tds };
}

async function main() {
  const adc = new Ads1x15(ADS1115, ADS1115_ADDRESS);
  await adc.openBus(I2C_BUS);

  console.log('Hệ thống khởi động...');
  console.log(`ADS1115: address=0x${ADS1115_ADDRESS.toString(16)}, bus=${I2C_BUS}, channel=A${TDS_CHANNEL}`);
  console.log(`Bắt đầu đọc TDS và DS18B20 mỗi ${READ_INTERVAL_MS / 1000}s. Nhấn Ctrl+C để dừng.`);
  console.log('---------------------------------------------------------------------');

  let reading = false;

  async function loop() {
    if (reading) {
      console.log('Bỏ qua chu kỳ này vì lần đọc trước chưa hoàn tất...');
      return;
    }

    reading = true;
    try {
      const { temperature, voltage, tds } = await readTDSAndTemperature(adc);
      console.log(`Nhiệt độ nước: ${temperature.toFixed(2)} °C | Điện áp TDS: ${voltage.toFixed(3)} V | TDS: ${tds.toFixed(2)} ppm`);
    } catch (err) {
      console.error('Lỗi đọc TDS:', err.message);
    } finally {
      reading = false;
    }
  }

  await loop();
  setInterval(loop, READ_INTERVAL_MS);
}

if (require.main === module) {
  main().catch(err => {
    console.error('Không khởi động được tds2:', err.message);
    process.exit(1);
  });
}

module.exports = {
  calculateTDS,
  readTDSAndTemperature,
};
