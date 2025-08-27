@echo off
pnpm build
if %errorlevel% neq 0 exit /b %errorlevel%
pnpm start