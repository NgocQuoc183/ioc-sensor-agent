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
  
  module.exports = { readDS18B20 };
