module.exports = {
  apps: [
    {
      name: 'yeirin',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_file: '.env',
      // NODE_ENV는 .env 파일에서 로드 (deploy/dev = development)
    },
  ],
};
