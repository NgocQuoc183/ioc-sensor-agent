  const fs = require('fs');
  const path = require('path');
  
  const W1_BASE = '/sys/bus/w1/devices';
  
  function findDS18B20Device() {
    const devices = fs.readdirSync(W1_BASE).filter(d => d.startsWith('28-'));
    if (devices.length === 0) throw new Error('Không tìm thấy DS18B20');
    return path.join(W1_BASE, devices[0], 'w1_slave');
  }
  
  async function readDS18B20() {
    const deviceFile = findDS18B20Device();
    const raw = fs.readFileSync(deviceFile, 'utf8');
  
    if (!raw.includes('YES')) throw new Error('DS18B20 CRC lỗi');
  
    const match = raw.match(/t=(-?\d+)/);
    if (!match) throw new Error('Không đọc được nhiệt độ DS18B20');
  
    const temperature = parseInt(match[1]) / 1000;
    return { waterTemperature: parseFloat(temperature.toFixed(2)) };
  }
//  Đọc mỗi 2 giây
setInterval(async () => {
  try {
    const data = await readDS18B20();

    console.log(
      `[${new Date().toLocaleTimeString()}] Nhiệt độ nước:`,
      data.waterTemperature,
      '°C'
    );

  } catch (err) {
    console.error('Lỗi DS18B20:', err.message || err);
  }
}, 2000);
  module.exports = { readDS18B20 };
