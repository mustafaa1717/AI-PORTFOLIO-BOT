"""
Helper script to start both the FastAPI backend and Vite frontend concurrently.
Usage:
    python run_dev.py
"""

import os
import subprocess
import sys
import time

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
VENV_PYTHON = os.path.join(ROOT_DIR, ".venv", "Scripts", "python.exe")
if not os.path.exists(VENV_PYTHON):
    VENV_PYTHON = sys.executable

FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

def main():
    print("=" * 60)
    print("🚀 Starting AI Portfolio Chatbot (Backend + Frontend)")
    print("=" * 60)

    # 1. Start FastAPI backend
    backend_cmd = [
        VENV_PYTHON,
        "-m",
        "uvicorn",
        "main:app",
        "--reload",
        "--host",
        "127.0.0.1",
        "--port",
        "8000"
    ]
    print(f"[*] Starting FastAPI backend at http://127.0.0.1:8000 ...")
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=os.path.join(ROOT_DIR, "backend")
    )

    time.sleep(1)

    # 2. Start Vite frontend
    frontend_cmd = ["npm", "run", "dev"]
    print(f"[*] Starting Vite frontend at http://localhost:5173 ...")
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=FRONTEND_DIR,
        shell=True
    )

    print("\n✅ Both servers are running!")
    print("👉 Open frontend: http://localhost:5173")
    print("👉 Backend API docs: http://127.0.0.1:8000/docs")
    print("Press Ctrl+C to terminate both servers.\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping servers...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("Done.")

if __name__ == "__main__":
    main()
