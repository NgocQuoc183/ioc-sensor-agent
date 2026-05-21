// TDS đọc qua ADS1115 kênh A2
// Đơn vị: ppm
// Công thức tham khảo module TDS Gravity

const Ads1x15 = require('ads1x15');

const ADS1115 = 1;
const GAIN = 4096;
const SPS = 250;
const CHANNEL = 0;
const SCOUNT = 30;

async function readTDS(address = 0x4a, busNumber = 1, temperature = 25.0) {
  const adc = new Ads1x15(ADS1115, address);
  await adc.openBus(busNumber);

  // Đọc nhiều lần lấy trung bình để giảm nhiễu
  let sum = 0;
  for (let i = 0; i < SCOUNT; i++) {
    const v = await adc.readADCSingleEnded(CHANNEL, GAIN, SPS);
    sum += v;
    await new Promise(r => setTimeout(r, 10));
  }
  const averageVoltage = (sum / SCOUNT) / 1000;

  // Bù nhiệt độ
  const compensationCoefficient = 1.0 + 0.02 * (temperature - 25.0);
  const compensatedVoltage = averageVoltage / compensationCoefficient;

  // Chuyển đổi sang TDS
  const tds = parseFloat(
    ((133.42 * Math.pow(compensatedVoltage, 3)
      - 255.86 * Math.pow(compensatedVoltage, 2)
      + 857.39 * compensatedVoltage) * 0.5).toFixed(2)
  );
console.log(`TDS: ${tds} ppm`);
    console.log('TDS voltage:', averageVoltage.toFixed(6), 'V');
  return { tds: Math.max(0, tds) };
}

if (require.main === module) {
  readTDS()
    .then(({ tds }) => {console.log(`TDS: ${tds} ppm`);
    console.log('TDS voltage:', averageVoltage.toFixed(6), 'V');
})
    .catch(err => console.error('Lỗi đọc TDS:', err));
}

module.exports = { readTDS };
