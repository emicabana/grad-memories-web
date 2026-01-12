@echo off
REM Script para prueba de upload de asset
REM Requiere curl.exe en el PATH

setlocal enabledelayedexpansion

set BASE_URL=http://localhost:3000

REM Crear imagen de prueba si no existe
if not exist "test_image.png" (
  echo Creando imagen de prueba...
  REM Crear un PNG válido mínimo con PowerShell
  powershell -NoProfile -Command "^
    $png = @(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ^
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, ^
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, ^
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, ^
    0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, ^
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0xfe, 0xff, 0x00, 0x00, 0x00, 0x02, ^
    0x00, 0x01, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82 ^
    ); [IO.File]::WriteAllBytes('test_image.png', [byte[]]$png); Write-Host 'Imagen creada.'"
)

echo.
echo ============================================================
echo [PRUEBA] Subir asset con marca de agua
echo ============================================================

REM 1. Login
echo.
echo [1] Login admin...
for /f "tokens=*" %%A in ('curl.exe -s -X POST %BASE_URL%/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@gradmemories.com\",\"password\":\"admin123\"}"') do (
  set "login_response=%%A"
)
echo !login_response!

REM Extraer token (simple busqueda)
for /f "tokens=2 delims=:" %%A in ('echo !login_response! ^| findstr /i token') do (
  set "token=%%A"
  set "token=!token:~1,-2!"
  goto got_token
)
:got_token
echo Token: !token:~0,30!...

REM 2. Upload image
echo.
echo [2] Subiendo imagen de prueba...
for /f "tokens=*" %%A in ('curl.exe -s -X POST %BASE_URL%/api/uploads ^
  -H "Authorization: Bearer !token!" ^
  -F "file=@test_image.png"') do (
  set "upload_response=%%A"
)
echo !upload_response!

REM 3. List assets
echo.
echo [3] Listando todos los assets...
for /f "tokens=*" %%A in ('curl.exe -s -X GET %BASE_URL%/api/admin/assets ^
  -H "Authorization: Bearer !token!"') do (
  set "list_response=%%A"
)
echo !list_response!

echo.
echo ============================================================
echo Prueba de upload completada!
echo ============================================================
echo.
echo Proximos pasos:
echo 1. Fijar precio del asset con PUT /api/admin/assets/^<ID^>
echo 2. Crear preferencia de pago con POST /api/payments/create_preference
echo 3. Configurar ngrok para webhook publico
echo.
