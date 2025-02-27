#!/bin/bash
apt-get update
apt-get install -y golang curl
curl -fsSL https://ollama.com/install.sh | sh
apt-get clean
rm -rf /var/lib/apt/lists/*