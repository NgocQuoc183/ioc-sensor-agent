// DO đọc qua ADS1115 kênh A1
// Đơn vị: mg/L
// Công thức phụ thuộc module DO, thường: DO = voltage * factor

const Ads1x15 = require('ads1x15');

const GAIN = 4096;
const SPS = 250;
// Giá trị bão hòa DO ở 25°C ~ 8.26 mg/L, tương ứng khoảng điện áp 3.0V (tùy module)
const DO_SATURATION = 8.26;
const VOLTAGE_AT_SATURATION = 3.0;

async function readDO(address = 0x48, busNumber = 1) {
  const adc = new Ads1x15(busNumber);
  const voltage = await adc.readADCSingleEnded(address, 1, GAIN, SPS);
  const doValue = parseFloat(((voltage / VOLTAGE_AT_SATURATION) * DO_SATURATION).toFixed(2));
  return { dissolvedOxygen: Math.max(0, doValue) };
}

module.exports = { readDO };