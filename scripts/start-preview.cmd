@echo off
set ASTRO_TELEMETRY_DISABLED=1
"C:\Users\18977\AppData\Local\Temp\nodejs-portable\node-v22.23.2-win-x64\node.exe" "%~dp0..\node_modules\astro\bin\astro.mjs" dev --host > "%~dp0..\.preview-out.log" 2>&1