#!/bin/bash
docker build -t chat-gurudev:latest .

docker run -v $(pwd):/app -p 9127:9127 chat-gurudev:latest
