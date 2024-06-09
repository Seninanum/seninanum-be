#!/bin/bash

# .env 파일로부터 환경 변수를 읽어 설정
if [ -f /home/ubuntu/build/.env ]; then
  export $(cat /home/ubuntu/build/.env | xargs)
fi

# 설정한 환경 변수를 확인 (디버깅용)
echo "REST_API_KEY: $REST_API_KEY"
echo "REDIRECT_URI: $REDIRECT_URI"
echo "JWT_SECRET: $JWT_SECRET"
