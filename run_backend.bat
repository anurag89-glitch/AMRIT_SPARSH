@echo off
echo Starting Amrit Sparsh Backend...
call venv\Scripts\activate
uvicorn backend.main:app --reload
pause
