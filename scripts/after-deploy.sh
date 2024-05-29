#!/bin/bash
REPOSITORY=/home/ubuntu/deploy

cd $REPOSITORY

# npm을 사용하여 배포 스크립트 실행
sudo /usr/bin/npm run deploy
