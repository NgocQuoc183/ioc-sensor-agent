const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const DEVICE_ID = process.env.DEVICE_ID || 'station-001';
const TIMEZONE = process.env.TIMEZONE || 'Asia/Ho_Chi_Minh';

/**
 * lay thoi gian hien tai theo dinh dang ISO 8601
 * vd: 2024-06-01T12:00:00.000Z
 * luu y: API yeu cau dinh dang nay de dong bo thoi gian giua cac thiet bi va server
 * de dam bao idempotency key duoc tao ra dung quy tac va khong bi trung lap
 */
function nowIso8601() {
  return new Date().toISOString();
}
/**
 * tao idempotency key de dam bao request khong bi trung lap khi gui len server
 * quy tac tao idempotency key: {DEVICE_ID}-{parameterCode}-{observationTime}
 * trong do:
 * - DEVICE_ID: ma thiet bi, vd: station-001
 * - parameterCode: ma tham so, vd: temperature
 * - observationTime: thoi gian quan sat theo dinh dang ISO 8601, vd: 2024-06-01T12:00:00.000Z
 * luu y: observationTime se duoc chuyen ve dang chi co so de tranh ky tu dac biet, vd: 20240601120000000
 * @param {*} parameterCode 
 * @param {*} time 
 * @returns 
 */
function makeIdempotencyKey(parameterCode, time) {
  return `${DEVICE_ID}-${parameterCode}-${time.replace(/[^0-9]/g, '')}`;
}

async function sendObservation(parameterCode, valueNumeric, unit) {
  const observationTime = nowIso8601();
  const payload = {
    deviceId: DEVICE_ID,
    parameterCode,
    valueNumeric,
    unit,
    observationTime,
    timezone: TIMEZONE,
    idempotencyKey: makeIdempotencyKey(parameterCode, observationTime),
    rawPayload: JSON.stringify({ source: 'raspberry-pi', parameterCode, valueNumeric }),
  };

  const res = await axios.post(`${API_BASE_URL}/api/IotObservation/push`, payload, {
    timeout: 15000,
  });
  return res.data;
}

async function sendBatch(observations) {
  const batchPayload = {
    deviceId: DEVICE_ID,
    observations: observations.map(({ parameterCode, valueNumeric, unit }) => ({
      parameterCode,
      valueNumeric,
      unit,
      observationTime: nowIso8601(),
      timezone: TIMEZONE,
    })),
  };

  const res = await axios.post(`${API_BASE_URL}/api/IotObservation/batch`, batchPayload, {
    timeout: 15000,
  });
  return res.data;
}

module.exports = { sendObservation, sendBatch };