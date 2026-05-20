// TDS đọc qua ADS1115 kênh A2
// Đơn vị: ppm
// Công thức tham khảo module TDS Gravity

const Ads1x15 = require('ads1x15');

const GAIN = 4096;
const SPS = 250;
const VREF = 3.3;
const SCOUNT = 30;

async function readTDS(address = 0x48, busNumber = 1, temperature = 25.0) {
  const adc = new Ads1x15(busNumber);

  // Đọc nhiều lần lấy trung bình để giảm nhiễu
  let sum = 0;
  for (let i = 0; i < SCOUNT; i++) {
    const v = await adc.readADCSingleEnded(address, 2, GAIN, SPS);
    sum += v;
    await new Promise(r => setTimeout(r, 10));
  }
  const averageVoltage = sum / SCOUNT;

  // Bù nhiệt độ
  const compensationCoefficient = 1.0 + 0.02 * (temperature - 25.0);
  const compensatedVoltage = averageVoltage / compensationCoefficient;

  // Chuyển đổi sang TDS
  const tds = parseFloat(
    ((133.42 * Math.pow(compensatedVoltage, 3)
      - 255.86 * Math.pow(compensatedVoltage, 2)
      + 857.39 * compensatedVoltage) * 0.5).toFixed(2)
  );

  return { tds: Math.max(0, tds) };
}

module.exports = { readTDS };