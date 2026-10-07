$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = (Resolve-Path (Join-Path $ScriptDir "..\..")).Path
$RootDir = (Resolve-Path (Join-Path $BackendDir "..")).Path
$FrontendDir = Join-Path $RootDir "frontend"

$EvidenceRoot = Join-Path $RootDir "evidencia\manual-usuario"
$InfraDir = Join-Path $EvidenceRoot "_infra"

$ComposeFile = Join-Path $ScriptDir "docker-compose.e2e.yml"
$ApplicationE2EFile = Join-Path $ScriptDir "application-e2e.yml"
$BackendWrapper = Join-Path $BackendDir "mvnw.cmd"
$ManualEvidenceScript = Join-Path $FrontendDir "e2e\manual\manual-evidence.mjs"

New-Item -ItemType Directory -Force -Path $EvidenceRoot, $InfraDir | Out-Null

$backendProcess = $null
$frontendProcess = $null

$originalEnvironment = @{
    SPRING_PROFILES_ACTIVE = $env:SPRING_PROFILES_ACTIVE
    SPRING_CONFIG_ADDITIONAL_LOCATION = $env:SPRING_CONFIG_ADDITIONAL_LOCATION
    VITE_API_URL = $env:VITE_API_URL
    PAMAHE_MANUAL_BASE_URL = $env:PAMAHE_MANUAL_BASE_URL
    PAMAHE_MANUAL_API_URL = $env:PAMAHE_MANUAL_API_URL
}

function Assert-CommandExists {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command
    )

    if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
        throw "No se encontró el comando requerido '$Command' en PATH."
    }
}

function Assert-FileExists {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [string]$Description
    )

    if (-not (Test-Path $Path -PathType Leaf)) {
        throw "No se encontró $Description en: $Path"
    }
}

function Invoke-NativeLogged {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,

        [string[]]$Arguments = @(),

        [Parameter(Mandatory = $true)]
        [string]$LogPath,

        [string]$WorkingDirectory,

        [Parameter(Mandatory = $true)]
        [string]$FailureMessage
    )

    $previousErrorActionPreference = $ErrorActionPreference
    $previousLocation = Get-Location
    $exitCode = -1

    try {
        $ErrorActionPreference = "Continue"

        if ($WorkingDirectory) {
            Set-Location $WorkingDirectory
        }

        & $FilePath @Arguments *>> $LogPath
        $exitCode = $LASTEXITCODE
    }
    finally {
        Set-Location $previousLocation
        $ErrorActionPreference = $previousErrorActionPreference
    }

    if ($exitCode -ne 0) {
        throw "$FailureMessage Código de salida: $exitCode. Revisar: $LogPath"
    }
}

function Invoke-DockerCompose {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,

        [switch]$BestEffort
    )

    $logPath = Join-Path $InfraDir "docker-compose.log"
    $previousErrorActionPreference = $ErrorActionPreference
    $exitCode = -1

    try {
        $ErrorActionPreference = "Continue"

        $composeArgs = @("compose", "-f", $ComposeFile) + $Arguments
        & docker @composeArgs *>> $logPath
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    if ($exitCode -ne 0 -and -not $BestEffort) {
        throw "Docker Compose falló con código de salida $exitCode. Revisar: $logPath"
    }
}

function Wait-ForMySql {
    param(
        [int]$TimeoutSeconds = 60
    )

    for ($i = 0; $i -lt $TimeoutSeconds; $i++) {
        $previousErrorActionPreference = $ErrorActionPreference
        $mysqlExitCode = -1

        try {
            $ErrorActionPreference = "Continue"

            $dockerArgs = @(
                "exec",
                "-e",
                "MYSQL_PWD=pamahe_e2e_root_2026",
                "pamahe_mysql_e2e",
                "mysqladmin",
                "ping",
                "-h",
                "127.0.0.1",
                "-uroot",
                "--silent"
            )

            & docker @dockerArgs 1>$null 2>$null
            $mysqlExitCode = $LASTEXITCODE
        }
        finally {
            $ErrorActionPreference = $previousErrorActionPreference
        }

        if ($mysqlExitCode -eq 0) {
            return $true
        }

        Start-Sleep -Seconds 1
    }

    return $false
}

function Wait-ForHttpEndpoint {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Url,

        [Parameter(Mandatory = $true)]
        [int]$TimeoutSeconds,

        [System.Diagnostics.Process]$Process,

        [Parameter(Mandatory = $true)]
        [string]$FailureMessage
    )

    for ($i = 0; $i -lt $TimeoutSeconds; $i++) {
        if ($Process) {
            if ($Process.HasExited) {
                throw "$FailureMessage El proceso terminó prematuramente con código $($Process.ExitCode)."
            }
        }

        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 3

            if ($response.StatusCode -eq 200) {
                return $true
            }
        }
        catch {
        }

        Start-Sleep -Seconds 1
    }

    return $false
}

function Stop-ProcessTree {
    param(
        [System.Diagnostics.Process]$Process
    )

    if (-not $Process) {
        return
    }

    try {
        if (-not $Process.HasExited) {
            $taskKillArgs = @("/PID", "$($Process.Id)", "/T", "/F")
            $taskKillProcess = Start-Process -FilePath "taskkill.exe" -ArgumentList $taskKillArgs -NoNewWindow -Wait -PassThru
            $null = $taskKillProcess.ExitCode
        }
    }
    catch {
    }
}

function Stop-ManualProcesses {
    Stop-ProcessTree -Process $frontendProcess
    Stop-ProcessTree -Process $backendProcess
    Invoke-DockerCompose -Arguments @("down", "-v", "--remove-orphans") -BestEffort
}

function Restore-Environment {
    foreach ($name in $originalEnvironment.Keys) {
        $originalValue = $originalEnvironment[$name]

        if ($null -eq $originalValue) {
            Remove-Item "Env:$name" -ErrorAction SilentlyContinue
        }
        else {
            Set-Item "Env:$name" $originalValue
        }
    }
}

Assert-CommandExists "docker"
Assert-CommandExists "npm.cmd"
Assert-CommandExists "node"

Assert-FileExists -Path $ComposeFile -Description "docker-compose.e2e.yml"
Assert-FileExists -Path $ApplicationE2EFile -Description "application-e2e.yml"
Assert-FileExists -Path $BackendWrapper -Description "Maven Wrapper"
Assert-FileExists -Path $ManualEvidenceScript -Description "manual-evidence.mjs"

try {
    Write-Host "[1/5] Iniciando MySQL E2E aislado"

    Invoke-DockerCompose -Arguments @("down", "-v", "--remove-orphans") -BestEffort
    Invoke-DockerCompose -Arguments @("up", "-d")

    $mysqlReady = Wait-ForMySql -TimeoutSeconds 60

    if (-not $mysqlReady) {
        $dockerLog = Join-Path $InfraDir "docker-compose.log"
        throw "MySQL E2E no quedó disponible después de 60 segundos. Revisar: $dockerLog"
    }

    Write-Host "      MySQL E2E disponible."

    Write-Host "[2/5] Iniciando backend con perfil E2E"

    $backendStdOutLog = Join-Path $InfraDir "backend-console.log"
    $backendStdErrLog = Join-Path $InfraDir "backend-console-error.log"

    $env:SPRING_PROFILES_ACTIVE = "e2e"
    $env:SPRING_CONFIG_ADDITIONAL_LOCATION = "file:./ops/e2e/application-e2e.yml"

    $backendStartInfo = @{
        FilePath = "cmd.exe"
        ArgumentList = @("/d", "/c", "mvnw.cmd spring-boot:run")
        WorkingDirectory = $BackendDir
        RedirectStandardOutput = $backendStdOutLog
        RedirectStandardError = $backendStdErrLog
        PassThru = $true
    }

    $backendProcess = Start-Process @backendStartInfo

    $backendReady = Wait-ForHttpEndpoint -Url "http://127.0.0.1:18080/api/actuator/health" -TimeoutSeconds 120 -Process $backendProcess -FailureMessage "Backend E2E no quedó disponible."

    if (-not $backendReady) {
        throw "Backend E2E no quedó disponible después de 120 segundos. Revisar: $backendStdOutLog y $backendStdErrLog"
    }

    Write-Host "      Backend E2E disponible."

    Write-Host "[3/5] Construyendo y sirviendo frontend"

    $npmCiLog = Join-Path $InfraDir "npm-ci.log"
    $frontendBuildLog = Join-Path $InfraDir "frontend-build.log"
    $frontendPreviewLog = Join-Path $InfraDir "frontend-preview.log"
    $frontendPreviewErrorLog = Join-Path $InfraDir "frontend-preview-error.log"

    if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
        Write-Host "      node_modules no existe. Ejecutando npm ci..."

        Invoke-NativeLogged -FilePath "npm.cmd" -Arguments @("ci") -WorkingDirectory $FrontendDir -LogPath $npmCiLog -FailureMessage "npm ci falló."
    }

    $env:VITE_API_URL = "http://127.0.0.1:18080/api"

    Invoke-NativeLogged -FilePath "npm.cmd" -Arguments @("run", "build") -WorkingDirectory $FrontendDir -LogPath $frontendBuildLog -FailureMessage "Frontend build falló."

    $frontendStartInfo = @{
        FilePath = "cmd.exe"
        ArgumentList = @("/d", "/c", "npm.cmd run preview -- --host 127.0.0.1 --port 15173 --strictPort")
        WorkingDirectory = $FrontendDir
        RedirectStandardOutput = $frontendPreviewLog
        RedirectStandardError = $frontendPreviewErrorLog
        PassThru = $true
    }

    $frontendProcess = Start-Process @frontendStartInfo

    $frontendReady = Wait-ForHttpEndpoint -Url "http://127.0.0.1:15173" -TimeoutSeconds 60 -Process $frontendProcess -FailureMessage "Frontend no quedó disponible."

    if (-not $frontendReady) {
        throw "Frontend no quedó disponible después de 60 segundos. Revisar: $frontendPreviewLog y $frontendPreviewErrorLog"
    }

    Write-Host "      Frontend disponible."

    Write-Host "[4/5] Generando evidencia PNG para el manual"

    $manualRunnerLog = Join-Path $InfraDir "manual-runner.log"
    Set-Content -Path $manualRunnerLog -Value "" -Encoding UTF8

    $env:PAMAHE_MANUAL_BASE_URL = "http://127.0.0.1:15173"
    $env:PAMAHE_MANUAL_API_URL = "http://127.0.0.1:18080/api"
    $env:PAMAHE_MANUAL_EVIDENCE_DIR = $EvidenceRoot

    Invoke-NativeLogged -FilePath "node" -Arguments @("e2e/manual/manual-evidence.mjs") -WorkingDirectory $FrontendDir -LogPath $manualRunnerLog -FailureMessage "La suite de evidencia del manual falló."

    Write-Host "[5/5] Finalizado"
    Write-Host ""
    Write-Host "Las capturas están en:"
    Write-Host "  $EvidenceRoot"
    Write-Host ""
    Write-Host "Los logs de infraestructura están en:"
    Write-Host "  $InfraDir"
}
catch {
    Write-Host ""
    Write-Host "ERROR DURANTE LA GENERACIÓN DE EVIDENCIA"
    Write-Host ""
    Write-Host $_.Exception.Message
    Write-Host ""
    Write-Host "Revisar los logs en:"
    Write-Host "  $InfraDir"
    Write-Host ""
}
finally {
    Write-Host ""
    Write-Host "Limpiando procesos e infraestructura E2E..."

    Stop-ManualProcesses
    Restore-Environment

    Write-Host "Limpieza finalizada."
}