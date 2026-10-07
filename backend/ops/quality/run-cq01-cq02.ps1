param(
    [string]$EvidenceRoot = ""
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendRoot = (Resolve-Path (Join-Path $ScriptDir "../..")).Path
$RepoRoot = (Resolve-Path (Join-Path $BackendRoot "..")).Path

if ([string]::IsNullOrWhiteSpace($EvidenceRoot)) {
    $EvidenceRoot = Join-Path $RepoRoot "evidencia"
}

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"

$Cq01 = Join-Path $EvidenceRoot "CQ-01/$Stamp"
$Cq02 = Join-Path $EvidenceRoot "CQ-02/$Stamp"

New-Item -ItemType Directory -Force -Path $Cq01, $Cq02 | Out-Null

$EnvLog = Join-Path $Cq01 "environment.log"

"timestamp=$Stamp" | Set-Content -Encoding UTF8 $EnvLog
"backend=$BackendRoot" | Add-Content -Encoding UTF8 $EnvLog

"--- java ---" | Add-Content -Encoding UTF8 $EnvLog

$JavaOutput = & cmd.exe /d /c "java --version 2>&1"
$JavaStatus = $LASTEXITCODE

($JavaOutput | Out-String) |
    Add-Content -Encoding UTF8 $EnvLog

if ($JavaStatus -ne 0) {
    "Java 17 debe estar disponible para ejecutar CQ-01/CQ-02." |
        Set-Content -Encoding UTF8 (Join-Path $Cq01 "java-required.log")

    exit $JavaStatus
}

"--- docker ---" | Add-Content -Encoding UTF8 $EnvLog

if (Get-Command docker -ErrorAction SilentlyContinue) {

    $DockerVersionOutput = & cmd.exe /d /c "docker --version 2>&1"
    $DockerVersionStatus = $LASTEXITCODE

    ($DockerVersionOutput | Out-String) |
        Add-Content -Encoding UTF8 $EnvLog

    if ($DockerVersionStatus -ne 0) {
        "No fue posible obtener la versión de Docker." |
            Set-Content -Encoding UTF8 (Join-Path $Cq02 "docker-required.log")

        exit $DockerVersionStatus
    }

    $DockerInfoOutput = & cmd.exe /d /c "docker info 2>&1"
    $DockerInfoStatus = $LASTEXITCODE

    ($DockerInfoOutput | Out-String) |
        Add-Content -Encoding UTF8 $EnvLog

    if ($DockerInfoStatus -ne 0) {
        "Docker debe estar iniciado para CQ-02/Testcontainers." |
            Set-Content -Encoding UTF8 (Join-Path $Cq02 "docker-required.log")

        exit $DockerInfoStatus
    }

} else {

    "docker no encontrado" |
        Add-Content -Encoding UTF8 $EnvLog

    "Docker debe estar instalado e iniciado para CQ-02/Testcontainers." |
        Set-Content -Encoding UTF8 (Join-Path $Cq02 "docker-required.log")

    exit 2
}

$MavenStatus = 1

Push-Location $BackendRoot

try {

    "--- maven wrapper ---" |
        Add-Content -Encoding UTF8 $EnvLog

    $MavenVersionOutput = & cmd.exe /d /c ".\mvnw.cmd -v 2>&1"
    $MavenVersionStatus = $LASTEXITCODE

    ($MavenVersionOutput | Out-String) |
        Add-Content -Encoding UTF8 $EnvLog

    if ($MavenVersionStatus -ne 0) {
        "No fue posible ejecutar Maven Wrapper." |
            Add-Content -Encoding UTF8 $EnvLog

        $MavenStatus = $MavenVersionStatus
    }
    else {

        $VerifyLog = Join-Path $Cq01 "maven-clean-verify.log"

        & cmd.exe /d /c ".\mvnw.cmd clean verify 2>&1" |
            Tee-Object -FilePath $VerifyLog

        $MavenStatus = $LASTEXITCODE
    }

}
finally {
    Pop-Location
}

$Surefire = Join-Path $BackendRoot "target/surefire-reports"

if (Test-Path $Surefire) {

    Copy-Item `
        $Surefire `
        (Join-Path $Cq01 "surefire-reports") `
        -Recurse `
        -Force

    $Cq02Xml = Join-Path `
        $Surefire `
        "TEST-uy.edu.ctc.pamahe.integration.RefaccionOfflineConcurrencyMySqlIntegrationTest.xml"

    $Cq02Txt = Join-Path `
        $Surefire `
        "uy.edu.ctc.pamahe.integration.RefaccionOfflineConcurrencyMySqlIntegrationTest.txt"

    if (Test-Path $Cq02Xml) {
        Copy-Item $Cq02Xml $Cq02 -Force
    }

    if (Test-Path $Cq02Txt) {
        Copy-Item $Cq02Txt $Cq02 -Force
    }
}

$Jacoco = Join-Path $BackendRoot "target/site/jacoco"

if (Test-Path $Jacoco) {

    Copy-Item `
        $Jacoco `
        (Join-Path $Cq01 "jacoco") `
        -Recurse `
        -Force
}

$PmdXml = Join-Path $BackendRoot "target/pmd.xml"

if (Test-Path $PmdXml) {
    Copy-Item $PmdXml $Cq01 -Force
}

$PmdHtml = Join-Path $BackendRoot "target/site/pmd.html"

if (Test-Path $PmdHtml) {
    Copy-Item $PmdHtml $Cq01 -Force
}


$SummaryDir = Join-Path $EvidenceRoot "resumen/$Stamp"

New-Item `
    -ItemType Directory `
    -Force `
    -Path $SummaryDir |
    Out-Null

$SummaryStatus = 1
$ExtractorPath = Join-Path $ScriptDir "extract-cq-evidence.py"

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {

    "Python no está disponible en PATH." |
        Set-Content `
            -Encoding UTF8 `
            (Join-Path $SummaryDir "python-required.log")

    $SummaryStatus = 3
}
elseif (-not (Test-Path $ExtractorPath)) {

    "No se encontró extract-cq-evidence.py." |
        Set-Content `
            -Encoding UTF8 `
            (Join-Path $SummaryDir "extractor-required.log")

    $SummaryStatus = 3
}
else {

    $ExtractorCommand = 'python "{0}" "{1}" "{2}" 2>&1' -f `
        $ExtractorPath, `
        $BackendRoot, `
        $SummaryDir

    $ExtractorOutput = & cmd.exe /d /c $ExtractorCommand
    $SummaryStatus = $LASTEXITCODE

    if ($null -ne $ExtractorOutput) {

        $ExtractorOutput |
            Tee-Object `
                -FilePath (Join-Path $SummaryDir "extract-cq-evidence.log")
    }
}

$ShaFile = Join-Path $SummaryDir "sha256.txt"

Get-ChildItem `
    $EvidenceRoot `
    -File `
    -Recurse |
    Where-Object {
        $_.FullName -ne $ShaFile
    } |
    Sort-Object FullName |
    ForEach-Object {

        $Hash = Get-FileHash `
            -Algorithm SHA256 `
            $_.FullName

        $RelativePath = $_.FullName.Substring(
            $EvidenceRoot.Length + 1
        )

        "$($Hash.Hash)  $RelativePath"
    } |
    Set-Content `
        -Encoding UTF8 `
        $ShaFile


if ($MavenStatus -ne 0) {
    exit $MavenStatus
}

exit $SummaryStatus