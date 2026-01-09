module.exports = {
  apps: [
    {
      name: 'anyway-ro',
      script: 'server.js',
      cwd: '/opt/anyway-flight-schedule',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'victoriaocara',
      script: 'npm',
      args: 'start',
      cwd: '/opt/victoriaocara',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};