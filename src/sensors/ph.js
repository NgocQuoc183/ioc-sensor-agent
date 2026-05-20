// pH đọc qua ADS1115 kênh A0
// Công thức chuyển đổi: tùy module pH, thường là pH = slope * voltage + offset
// Cần hiệu chuẩn bằng dung dịch chuẩn pH 4.0 và pH 7.0

const Ads1x15 = require('ads1x15');

const GAIN = 4096; // ±4.096V
const SPS = 250;

async function readPH(address = 0x48, busNumber = 1, offset = 0.0, slope = 1.0) {
  const adc = new Ads1x15(busNumber);
  const voltage = await adc.readADCSingleEnded(address, 0, GAIN, SPS);
  // Công thức tham khảo module SEN0161: pH = 3.5 * voltage + offset
  const ph = parseFloat((slope * (3.5 * voltage) + offset).toFixed(2));
  return { ph: Math.max(0, Math.min(14, ph)) };
}

module.exports = { readPH };