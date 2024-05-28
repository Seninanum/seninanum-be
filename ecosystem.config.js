module.exports = {
  apps: [
    {
      name: "app",
      script: "./bin/www", // www 파일을 실행 스크립트로 지정
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
