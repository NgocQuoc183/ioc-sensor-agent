module.exports = {
  apps: [
    {
      name: 'ioc-sensor-agent',
      script: 'src/main.js',
      cwd: '/home/raspi/Project/ioc-sensor-agent',
      env_file: '.env',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '5s',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      out_file: '/home/raspi/Project/ioc-sensor-agent/logs/sensor-agent-out.log',
      error_file: '/home/raspi/Project/ioc-sensor-agent/logs/sensor-agent-err.log',
      merge_logs: true,
    },
  ],
deploy: {
    production: {
      user: 'raspi',

      host: 'raspi.local',

      ref: 'origin/main',

      repo: 'https://github.com/vietthuan1998/ioc-sensor-agent.git',

      path: '/home/raspi/Project/ioc-sensor-agent',

      'post-deploy':
        'npm install && pm2 reload ecosystem.config.js',
    },
  },
};
