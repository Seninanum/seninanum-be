#!/bin/bash
REPOSITORY=/home/ubuntu/build

cd $REPOSITORY

git pull origin main

# npm을 사용하여 패키지 설치
sudo /usr/bin/npm install

# pm2를 사용하여 애플리케이션 재시작
sudo pm2 restart all
