@echo off
set "PATH=C:\Users\aayus\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;%PATH%"
echo Compiling TypeScript...
"C:\Users\aayus\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" "node_modules\typescript\bin\tsc" -b
if errorlevel 1 (
  echo TypeScript check failed!
  pause
  exit /b 1
)
echo Building production bundle with Vite...
"C:\Users\aayus\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" "node_modules\vite\bin\vite.js" build
echo Build completed successfully!
pause
