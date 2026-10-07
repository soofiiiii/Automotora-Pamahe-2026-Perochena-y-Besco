param(
  [string]$ProjectRoot = "."
)

$ErrorActionPreference = "Stop"

$packageRoot = Split-Path -Parent $PSScriptRoot
$sql = Join-Path $packageRoot "sql\pamahe_dataset_manual_completo.sql"
$verifySql = Join-Path $packageRoot "sql\04_verificar_dataset.sql"
$mediaScript = Join-Path $PSScriptRoot "preparar_media_prueba.ps1"

if (-not (Test-Path (Join-Path $ProjectRoot "docker-compose.yml"))) {
  throw "No encuentro docker-compose.yml en: $ProjectRoot"
}
if (-not (Test-Path $sql)) {
  throw "No encuentro el SQL completo: $sql"
}
if (-not (Test-Path $verifySql)) {
  throw "No encuentro el SQL de verificacion: $verifySql"
}
if (-not (Test-Path $mediaScript)) {
  throw "No encuentro el script de preparacion de media: $mediaScript"
}

Write-Host "1/4 Preparando media de prueba..." -ForegroundColor Cyan
& powershell -ExecutionPolicy Bypass -File $mediaScript -ProjectRoot $ProjectRoot
if ($LASTEXITCODE -ne 0) {
  throw "La preparacion de media fallo."
}

Write-Host "2/4 Copiando SQL al contenedor pamahe_mysql..." -ForegroundColor Cyan
docker cp $sql "pamahe_mysql:/tmp/pamahe_dataset_manual_completo.sql"
if ($LASTEXITCODE -ne 0) {
  throw "docker cp fallo. Verifica que el contenedor pamahe_mysql este iniciado."
}

Write-Host "3/4 Borrando datos funcionales y cargando dataset..." -ForegroundColor Cyan
docker exec pamahe_mysql sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < /tmp/pamahe_dataset_manual_completo.sql'
if ($LASTEXITCODE -ne 0) {
  throw "La carga SQL fallo."
}

Write-Host "4/4 Verificando dataset..." -ForegroundColor Cyan
docker cp $verifySql "pamahe_mysql:/tmp/04_verificar_dataset.sql"
if ($LASTEXITCODE -ne 0) {
  throw "No se pudo copiar el SQL de verificacion."
}

docker exec pamahe_mysql sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < /tmp/04_verificar_dataset.sql'
if ($LASTEXITCODE -ne 0) {
  throw "La verificacion SQL fallo."
}

Write-Host "Dataset Pamahe recargado y verificado correctamente." -ForegroundColor Green
