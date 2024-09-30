module.exports = {
  apps: [
    {
      name: "app",
      script: "./src/app.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 3001,
      },
    },
  ],
};
