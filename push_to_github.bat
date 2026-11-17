@echo off
setlocal

echo ========================================================
echo   Push AI Portfolio Chatbot to GitHub
echo ========================================================
echo.

:: Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Git is not installed or not found in PATH.
    echo Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

:: Prompt for GitHub Repo URL if not provided as argument
set REPO_URL=%1
if "%REPO_URL%"=="" (
    echo Please enter your GitHub Repository URL.
    echo Example: https://github.com/mustafaa1717/ai-portfolio-chatbot.git
    set /p REPO_URL="Repository URL: "
)

if "%REPO_URL%"=="" (
    echo [ERROR] No repository URL provided. Aborting.
    pause
    exit /b 1
)

echo.
echo [1/5] Initializing Git repository...
if not exist ".git" (
    git init
    git branch -M main
) else (
    echo .git already exists, continuing...
)

echo.
echo [2/5] Staging files...
git add .

echo.
echo [3/5] Committing files...
git commit -m "Initial commit: Mustafa Shaikh AI Portfolio Chatbot & Recruiter Twin"

echo.
echo [4/5] Setting up remote origin...
git remote remove origin >nul 2>nul
git remote add origin %REPO_URL%

echo.
echo [5/5] Pushing to GitHub (main branch)...
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo   SUCCESS! Your code has been pushed to GitHub.
    echo ========================================================
) else (
    echo.
    echo [NOTICE] If push failed due to remote containing files (e.g. README/License),
    echo you can force push or pull first:
    echo   git pull origin main --rebase
    echo   git push -u origin main
)

echo.
pause
