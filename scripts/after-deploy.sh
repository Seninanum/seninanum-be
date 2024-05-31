#!/bin/bash
REPOSITORY=/home/ubuntu/seninanum-be

cd $REPOSITORY

# Install dependencies
npm install

# Start or restart the application with PM2, updating environment variables
pm2 start ./bin/www --name "" --update-env

# Save the PM2 process list and corresponding environments
pm2 save

