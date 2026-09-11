#!/bin/bash
if ! pgrep -f "ollama serve" > /dev/null; then
    ollama serve > /dev/null 2>&1 &
    sleep 3
fi
#ollama pull llama3.2
#ollama pull llama3.2:1b
#ollama pull llama3.2-vision
ollama pull moondream