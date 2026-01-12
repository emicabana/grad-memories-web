# setup_mongo_ffmpeg.ps1
# Ejecutar EN MODO ADMINISTRADOR
# Añade la carpeta bin de MongoDB (servicio) al PATH del sistema y, si Chocolatey está disponible,
# instala mongosh y ffmpeg.

function Is-Administrator {
  $current = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($current)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Is-Administrator)) {
  Write-Error "Este script debe ejecutarse como Administrador. Abre PowerShell 'Run as Administrator' y vuelve a ejecutar."
  exit 1
}

Write-Host "[1/5] Detectando servicio MongoDB..."
$svc = Get-CimInstance Win32_Service -Filter "Name='MongoDB'" -ErrorAction SilentlyContinue
if (-not $svc) {
  Write-Warning "No se encontró un servicio llamado 'MongoDB'. Si instalaste Mongo como servicio con otro nombre, ajusta el script."
} else {
  Write-Host "Service Path: $($svc.PathName)"
  $exe = ($svc.PathName -split ' --')[0].Trim('"')
  if (-not (Test-Path $exe)) { Write-Warning "Ejecutable no encontrado: $exe" }
  else {
    $bin = Split-Path $exe
    Write-Host "Mongo bin detectado: $bin"

    # Añadir al PATH del sistema si no existe
    $currentPath = [Environment]::GetEnvironmentVariable('Path','Machine')
    if ($currentPath -notlike "*${bin}*") {
      Write-Host "Añadiendo $bin al PATH del sistema..."
      $newPath = $currentPath + ";" + $bin
      [Environment]::SetEnvironmentVariable('Path', $newPath, 'Machine')
      Write-Host "PATH actualizado. Cierra y abre nuevas consolas para aplicar los cambios."
    } else { Write-Host "La carpeta bin ya está en PATH." }
  }
}

Write-Host "[2/5] Verificando Chocolatey..."
$choco = Get-Command choco -ErrorAction SilentlyContinue
if (-not $choco) {
  Write-Warning "Chocolatey no está instalado. Para instalar mongosh/ffmpeg automáticamente necesitas Chocolatey."
  Write-Host "Instalar Chocolatey: https://chocolatey.org/install (ejecutar en PowerShell con Admin)"
} else {
  Write-Host "Chocolatey detectado. Intentando instalar mongosh y ffmpeg..."
  try {
    choco install mongosh -y --no-progress
  } catch { Write-Warning "Error instalando mongosh: $($_.Exception.Message)" }
  try {
    choco install ffmpeg -y --no-progress
  } catch { Write-Warning "Error instalando ffmpeg: $($_.Exception.Message)" }
}

Write-Host "[3/5] Verificando versiones (si están en PATH)..."
try { mongod --version } catch { Write-Warning "mongod no disponible en PATH" }
try { mongosh --version } catch { Write-Warning "mongosh no disponible en PATH" }
try { ffmpeg -version } catch { Write-Warning "ffmpeg no disponible en PATH" }

Write-Host "[4/5] Estado del servicio MongoDB"
Get-Service -Name MongoDB -ErrorAction SilentlyContinue | Format-List

Write-Host "[5/5] Finalizado. Si añadiste al PATH, reinicia tu sesión o abre una nueva consola para ver los cambios." 
Write-Host "Si algo falló, pega la salida aquí y te ayudo a resolverlo."