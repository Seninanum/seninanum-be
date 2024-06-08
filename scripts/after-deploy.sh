#!/bin/bash
REPOSITORY=/home/ubuntu/build

cd $REPOSITORY

# Remove node_modules and package-lock.json
rm -rf node_modules
rm -f package-lock.json

# Install dependencies
npm install

# Restart the application (if needed)
pm2 restart ecosystem.config.js --env production
