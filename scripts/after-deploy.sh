#!/bin/bash
REPOSITORY=/home/ubuntu/build

cd $REPOSITORY

# npm을 사용하여 패키지 설치
sudo /usr/bin/npm install

# Prisma 사용 시 추가 명령어 실행
sudo /usr/bin/npm run db:pull # 해당 명령어는 Prisma를 사용하는 경우에만 실행
sudo /usr/bin/npm run generate # 해당 명령어는 Prisma를 사용하는 경우에만 실행

# pm2를 사용하여 애플리케이션 시작
sudo /usr/bin/pm2 start dist
