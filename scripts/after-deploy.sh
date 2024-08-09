#!/bin/bash
REPOSITORY=/home/ubuntu/build

echo "Changing directory to $REPOSITORY"
cd $REPOSITORY || exit

echo "Installing dependencies"
npm install

echo "Starting the application with PM2"
pm2 start src/app.js --name "seninanum" --update-env

echo "Saving PM2 process list"
pm2 save

echo "After deploy script executed successfully"
