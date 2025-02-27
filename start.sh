#!/bin/bash
docker build -t chat-gurudev:latest .

docker run -v $(pwd):/app -p 80:8080 chat-gurudev:latest


