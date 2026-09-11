#!/usr/bin/env zsh

set -e

echo "=================================================="
echo "          ATS Backend Startup Script              "
echo "=================================================="

# Standardmodell festlegen falls nicht gesetzt
LLM_MODEL=${LLM_MODEL:-"llama3.2"}

echo "[*] Prüfe Ollama Service..."
if ! pgrep -x "ollama" > /dev/null; then
  echo "[*] Starte Ollama Service..."
  ollama serve &
  sleep 2
else
  echo "[+] Ollama Service läuft bereits."
fi

echo "[*] Prüfe Verfügbarkeit des Modells: ${LLM_MODEL}..."
if ! ollama list | grep -q "${LLM_MODEL}"; then
  echo "[!] Modell '${LLM_MODEL}' nicht gefunden. Lade Modell herunter..."
  ollama pull "${LLM_MODEL}"
else
  echo "[+] Modell '${LLM_MODEL}' ist lokal vorhanden."
fi

# Pfad zum Backend-Verzeichnis ermitteln
SCRIPT_DIR="$(cd "$(dirname "${NC_SOURCE:-$0}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"

echo "[*] Wechsle in das Backend-Verzeichnis: ${BACKEND_DIR}"

if [ ! -f "${BACKEND_DIR}/server.js" ]; then
  echo "[!] Fehler: server.js wurde in ${BACKEND_DIR} nicht gefunden."
  exit 1
fi

cd "${BACKEND_DIR}"

if [ ! -d "node_modules" ]; then
  echo "[*] Installiere Node.js Abhängigkeiten..."
  npm install express cors
fi

echo "[+] Starte Node.js Proxy-Server..."
node server.js