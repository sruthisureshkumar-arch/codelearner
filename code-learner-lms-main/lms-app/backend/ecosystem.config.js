module.exports = {
  apps: [{
    name: 'lms-backend',
    script: 'src/server.js',
    instances: 'max',      // one process per CPU core
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5001,
    },
  }],
};
