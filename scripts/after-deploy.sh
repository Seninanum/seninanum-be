#!/bin/bash
REPOSITORY=/home/ubuntu/build

cd $REPOSITORY

# Install dependencies
npm install

# Start or restart the application with PM2, updating environment variables
pm2 start build/src/app.js --name 'seninanum-be'

# Save the PM2 process list and corresponding environments
pm2 save

