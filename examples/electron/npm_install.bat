@echo off
setlocal
call npm install
if errorlevel 1 exit /b %errorlevel%
call npm run download
if errorlevel 1 exit /b %errorlevel%
call npm run rebuild
endlocal
