$ErrorActionPreference = "Stop"

$OriginalLocation = Get-Location
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = (Resolve-Path (Join-Path $ScriptDir "..\..")).Path
$RootDir = (Resolve-Path (Join-Path $BackendDir "..")).Path
$FrontendDir = Join-Path $RootDir "frontend"
$EvidenceDir = Join-Path $RootDir "evidencia"
$CQ03Dir = Join-Path $EvidenceDir "CQ-03"
$CQ04Dir = Join-Path $EvidenceDir "CQ-04"
$ComposeFile = Join-Path $ScriptDir "docker-compose.e2e.yml"

New-Item -ItemType Directory -Force -Path $CQ03Dir, $CQ04Dir | Out-Null

$backendProcess = $null
$frontendProcess = $null

function Invoke-NativeCommand {
    param(
        [Parameter(Mandatory = $true)]
        [scriptblock]$Command,

        [string]$LogPath,

        [string]$FailureMessage = "El comando externo falló.",

        [switch]$AllowFailure,

        [switch]$DiscardOutput,

        [switch]$TeeOutput
    )

    $previousErrorActionPreference = $ErrorActionPreference
    $exitCode = 0

    try {
        # Windows PowerShell 5.1 puede convertir stderr de programas nativos
        # en NativeCommandError. Para esos procesos se valida el exit code real.
        $ErrorActionPreference = "Continue"

        if ($DiscardOutput) {
            & $Command *> $null
        }
        elseif ($TeeOutput -and $LogPath) {
            & $Command 2>&1 |
                Tee-Object -FilePath $LogPath |
                ForEach-Object { Write-Host $_ }
        }
        elseif ($LogPath) {
            & $Command *>> $LogPath
        }
        else {
            & $Command
        }

        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    if (-not $AllowFailure -and $exitCode -ne 0) {
        throw "$FailureMessage Exit code: $exitCode"
    }

    return $exitCode
}

function Stop-ListenerOnPort {
    param(
        [Parameter(Mandatory = $true)]
        [int]$Port
    )

    $listeners = Get-NetTCPConnection `
        -LocalPort $Port `
        -State Listen `
        -ErrorAction SilentlyContinue

    foreach ($listener in $listeners) {
        $pidToStop = $listener.OwningProcess
        Write-Host "[cleanup] Cerrando proceso residual PID $pidToStop en puerto $Port"

        [void](Invoke-NativeCommand `
            -Command { taskkill.exe /PID $pidToStop /T /F } `
            -AllowFailure `
            -DiscardOutput)
    }
}

function Stop-CQProcesses {
    if ($frontendProcess -and -not $frontendProcess.HasExited) {
        $frontendPid = $frontendProcess.Id
        [void](Invoke-NativeCommand `
            -Command { taskkill.exe /PID $frontendPid /T /F } `
            -AllowFailure `
            -DiscardOutput)
    }

    if ($backendProcess -and -not $backendProcess.HasExited) {
        $backendPid = $backendProcess.Id
        [void](Invoke-NativeCommand `
            -Command { taskkill.exe /PID $backendPid /T /F } `
            -AllowFailure `
            -DiscardOutput)
    }

    [void](Invoke-NativeCommand `
        -Command { docker compose -f $ComposeFile down -v --remove-orphans } `
        -LogPath (Join-Path $CQ03Dir "docker-compose.log") `
        -AllowFailure)
}

try {
    $javaVersion = & cmd.exe /d /c "java -version 2>&1" |
        Select-Object -First 1

    @(
        "run_started=$([DateTimeOffset]::Now.ToString('o'))"
        "git_commit=$(try { git -C $RootDir rev-parse HEAD } catch { 'unavailable' })"
        "java=$javaVersion"
        "node=$(& node --version)"
        "npm=$(& npm --version)"
        "docker=$(& docker --version)"
        "compose=$(& docker compose version)"
    ) | Set-Content (Join-Path $EvidenceDir "environment.txt")

    # Los puertos 18080 y 15173 son exclusivos del stack E2E. Se limpian
    # procesos huérfanos de ejecuciones previas antes de iniciar un stack nuevo.
    Stop-ListenerOnPort -Port 18080
    Stop-ListenerOnPort -Port 15173

    # Una vez detenidos los procesos huérfanos, se limpia únicamente la evidencia
    # de CQ-03/CQ-04 para que la corrida actual no mezcle logs anteriores.
    Get-ChildItem -Path $CQ03Dir -Force -ErrorAction SilentlyContinue |
        Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $CQ04Dir -Force -ErrorAction SilentlyContinue |
        Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

    Write-Host "[1/8] MySQL 8.4 aislado"
    $dockerComposeLog = Join-Path $CQ03Dir "docker-compose.log"

    [void](Invoke-NativeCommand `
        -Command { docker compose -f $ComposeFile down -v --remove-orphans } `
        -LogPath $dockerComposeLog `
        -FailureMessage "No se pudo limpiar el entorno Docker E2E.")

    [void](Invoke-NativeCommand `
        -Command { docker compose -f $ComposeFile up -d } `
        -LogPath $dockerComposeLog `
        -FailureMessage "No se pudo iniciar MySQL E2E.")

    $mysqlReady = $false
    for ($i = 0; $i -lt 60; $i++) {
        $mysqlExitCode = Invoke-NativeCommand `
            -Command {
                docker exec pamahe_mysql_e2e `
                    mysqladmin ping `
                    -h 127.0.0.1 `
                    -uroot `
                    -ppamahe_e2e_root_2026 `
                    --silent
            } `
            -AllowFailure `
            -DiscardOutput

        if ($mysqlExitCode -eq 0) {
            $mysqlReady = $true
            break
        }

        Start-Sleep -Seconds 1
    }

    if (-not $mysqlReady) {
        throw "MySQL E2E no quedó saludable."
    }

    Write-Host "[2/8] Backend real + Flyway"
    $backendLog = Join-Path $CQ03Dir "backend-console.log"
    $backendCmd = "Set-Location '$BackendDir'; `$env:SPRING_PROFILES_ACTIVE='e2e'; `$env:SPRING_CONFIG_ADDITIONAL_LOCATION='file:./ops/e2e/application-e2e.yml'; .\mvnw.cmd spring-boot:run *>> '$backendLog'"
    $backendProcess = Start-Process powershell -ArgumentList "-NoProfile", "-Command", $backendCmd -PassThru

    $backendReady = $false
    for ($i = 0; $i -lt 120; $i++) {
        if ($backendProcess.HasExited) { break }

        try {
            $health = Invoke-WebRequest `
                -UseBasicParsing `
                http://127.0.0.1:18080/api/actuator/health

            if ($health.StatusCode -eq 200) {
                $backendReady = $true
                $health.Content | Set-Content (Join-Path $CQ03Dir "backend-health.json")
                break
            }
        }
        catch {}

        Start-Sleep -Seconds 1
    }

    if (-not $backendReady) {
        throw "Backend E2E no quedó saludable. Revisá $backendLog"
    }

    Write-Host "[3/8] Frontend limpio apuntando al backend real"
    Set-Location $FrontendDir

    if (-not (Test-Path node_modules)) {
        [void](Invoke-NativeCommand `
            -Command { npm.cmd ci } `
            -LogPath (Join-Path $CQ03Dir "npm-ci.log") `
            -FailureMessage "npm ci falló.")
    }

    $env:VITE_API_URL = "http://127.0.0.1:18080/api"
    $env:PAMAHE_E2E_API_URL = "http://127.0.0.1:18080/api"
    $env:PAMAHE_E2E_BASE_URL = "http://127.0.0.1:15173"

    [void](Invoke-NativeCommand `
        -Command { npm.cmd run build } `
        -LogPath (Join-Path $CQ03Dir "frontend-build.log") `
        -FailureMessage "Frontend build falló.")

    $frontendProcess = Start-Process npm.cmd `
        -ArgumentList "run", "preview", "--", "--host", "127.0.0.1", "--port", "15173", "--strictPort" `
        -RedirectStandardOutput (Join-Path $CQ03Dir "frontend-preview.log") `
        -RedirectStandardError (Join-Path $CQ03Dir "frontend-preview-error.log") `
        -PassThru

    $frontReady = $false
    for ($i = 0; $i -lt 60; $i++) {
        if ($frontendProcess.HasExited) { break }

        try {
            if ((Invoke-WebRequest -UseBasicParsing http://127.0.0.1:15173).StatusCode -eq 200) {
                $frontReady = $true
                break
            }
        }
        catch {}

        Start-Sleep -Seconds 1
    }

    if (-not $frontReady) {
        throw "Frontend preview no quedó disponible."
    }

    Write-Host "[4/8] CQ-03 E2E real FE -> BE -> MySQL"
    $env:PAMAHE_CQ03_EVIDENCE_DIR = $CQ03Dir

    [void](Invoke-NativeCommand `
        -Command { node e2e/real-stack-flow.mjs } `
        -LogPath (Join-Path $CQ03Dir "runner-console.log") `
        -TeeOutput `
        -FailureMessage "CQ-03 falló.")

    Write-Host "[5/8] CQ-04 validación estática existente"
    $env:PAMAHE_ACCESSIBILITY_STATIC_ONLY = "1"

    [void](Invoke-NativeCommand `
        -Command { node e2e/accessibility-validation.mjs --static } `
        -LogPath (Join-Path $CQ04Dir "static-accessibility.log") `
        -TeeOutput `
        -FailureMessage "La validación estática CQ-04 falló.")

    Copy-Item `
        -Force `
        evidencias\accesibilidad\resultado-estatico.json `
        (Join-Path $CQ04Dir "resultado-estatico.json")

    Write-Host "[6/8] CQ-04 axe-core 4.13.0 + teclado"
    $env:PAMAHE_CQ04_EVIDENCE_DIR = $CQ04Dir

    [void](Invoke-NativeCommand `
        -Command {
            npm.cmd exec --yes --package=axe-core@4.13.0 -- `
                node e2e/axe-standard-validation.mjs
        } `
        -LogPath (Join-Path $CQ04Dir "axe-console.log") `
        -TeeOutput `
        -FailureMessage "axe/teclado falló.")

    Write-Host "[7/8] CQ-04 Lighthouse 13.5.0"

    [void](Invoke-NativeCommand `
        -Command {
            node e2e/lighthouse-accessibility.mjs
        } `
        -LogPath (Join-Path $CQ04Dir "lighthouse-console.log") `
        -TeeOutput `
        -FailureMessage "Lighthouse falló.")

    Write-Host "[8/8] Hashes"

    Stop-CQProcesses

    $backendProcess = $null
    $frontendProcess = $null

    Start-Sleep -Milliseconds 500

    $hashFile = Join-Path $EvidenceDir "SHA256SUMS.txt"

    Get-ChildItem -Path $EvidenceDir -File -Recurse |
        Where-Object { $_.FullName -ne $hashFile } |
        Sort-Object FullName |
        ForEach-Object {
            $hash = Get-FileHash `
                -Algorithm SHA256 `
                -Path $_.FullName

            "$($hash.Hash)  $($_.FullName.Substring($EvidenceDir.Length + 1))"
        } |
        Set-Content $hashFile

    Write-Host "CQ-03 y CQ-04 ejecutados correctamente. Evidencia: $EvidenceDir"
    }
finally {
    Stop-CQProcesses
}