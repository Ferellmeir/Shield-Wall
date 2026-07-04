@echo off
cd /d "%~dp0"
py -3.12 -m aider --model ollama_chat/ornith:latest
pause