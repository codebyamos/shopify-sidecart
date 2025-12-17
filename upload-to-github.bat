@echo off
echo ============================================
echo Shopify Sidecart - GitHub Upload Script
echo ============================================
echo.
echo BEFORE RUNNING THIS SCRIPT:
echo 1. Create repository at https://github.com/new
echo 2. Name it: shopify-sidecart
echo 3. DO NOT initialize with README
echo 4. Copy your GitHub username
echo.
set /p GITHUB_USERNAME="Enter your GitHub username: "
echo.
echo Setting up remote repository...
git remote add origin https://github.com/%GITHUB_USERNAME%/shopify-sidecart.git
if %errorlevel% neq 0 (
    echo Error: Failed to add remote repository
    pause
    exit /b 1
)

echo Renaming branch to main...
git branch -M main

echo Pushing to GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo SUCCESS! Plugin uploaded to GitHub.
    echo.
    echo Next steps:
    echo 1. Go to https://github.com/%GITHUB_USERNAME%/shopify-sidecart
    echo 2. Create a release (v2.1.0)
    echo 3. Update includes/updater.php with your username
) else (
    echo.
    echo ERROR: Failed to push to GitHub
    echo Check your credentials and try again
)

pause