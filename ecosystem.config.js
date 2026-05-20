module.exports = {
  apps: [
    {
      name: 'ioc-sensor-agent',
      script: 'src/main.js',
      cwd: '/home/pi/ioc-sensor-agent',
      env_file: '.env',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '5s',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      out_file: '/home/pi/logs/sensor-agent-out.log',
      error_file: '/home/pi/logs/sensor-agent-err.log',
      merge_logs: true,
    },
  ],
};