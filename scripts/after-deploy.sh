#!/bin/bash
REPOSITORY=/home/ubuntu/build

cd $REPOSITORY

# npm을 사용하여 패키지 설치
sudo /usr/bin/npm install

# pm2를 사용하여 애플리케이션 시작
sudo /opt/homebrew/bin/pm2 start dist
