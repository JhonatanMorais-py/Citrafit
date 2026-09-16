@echo off
setlocal

cd /d "%~dp0"
title CitraFit - Servidor Node.js

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao foi encontrado no PATH.
  echo Instale ou reinicie o Windows apos a instalacao do Node.js.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm nao foi encontrado no PATH.
  pause
  exit /b 1
)

if not exist ".env" (
  echo O arquivo .env nao foi encontrado.
  echo Configure as variaveis privadas antes de iniciar o projeto.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Instalando dependencias do projeto...
  call npm.cmd install
  if errorlevel 1 (
    echo Nao foi possivel instalar as dependencias.
    pause
    exit /b 1
  )
)

echo Iniciando o CitraFit...
echo Para encerrar o servidor, pressione Ctrl+C.
call npm.cmd start

if errorlevel 1 (
  echo O servidor foi encerrado com erro.
  pause
)

endlocal
