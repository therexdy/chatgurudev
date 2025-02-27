FROM debian:latest

WORKDIR /app

RUN chmod +x ./scripts/install_dependency.sh
RUN ./scripts/install_dependency.sh

RUN ollama pull deepseek-r1:70b
RUN ollama pull llama3:3
RUN go mod download
RUN go build -o ./chat_gurudev -ldflags="-s -w" ./src/

EXPOSE 8080

CMD ["./chat_gurudev"]