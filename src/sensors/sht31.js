const i2c = require('i2c-bus');

const SHT31_MEAS_HIGHREP = Buffer.from([0x24, 0x00]);

async function readSHT31(address = 0x44, busNumber = 1) {
  const bus = await i2c.openPromisified(busNumber);
  try {
    await bus.i2cWrite(address, 2, SHT31_MEAS_HIGHREP);
    await new Promise(r => setTimeout(r, 20));

    const buf = Buffer.alloc(6);
    await bus.i2cRead(address, 6, buf);

    const rawTemp = (buf[0] << 8) | buf[1];
    const rawHumidity = (buf[3] << 8) | buf[4];

    const temperature = -45 + 175 * rawTemp / 65535;
    const humidity = 100 * rawHumidity / 65535;

    return {
      temperature: parseFloat(temperature.toFixed(2)),
      humidity: parseFloat(humidity.toFixed(2)),
    };
  } finally {
    await bus.close();
  }
}

module.exports = { readSHT31 };