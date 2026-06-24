param(
    [switch]$SkipAssetDownload,
    [switch]$SkipInstaller
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Python = Join-Path $Root "backend\.venv\Scripts\python.exe"
$TesseractSource = if ($env:TESSERACT_HOME) { $env:TESSERACT_HOME } else { "C:\Program Files\Tesseract-OCR" }
$BuildDir = Join-Path $Root "build"
$OcrTarget = Join-Path $BuildDir "ocr"
$VendorDir = Join-Path $Root "docs\vendor"

if (-not (Test-Path $Python)) {
    throw "No se encontro el entorno Python de la plataforma. Ejecuta primero Consulta Habitacional.bat."
}
if (-not (Test-Path (Join-Path $TesseractSource "tesseract.exe"))) {
    throw "No se encontro Tesseract OCR. Instala Tesseract antes de crear el instalador."
}

New-Item -ItemType Directory -Force -Path $BuildDir, $OcrTarget, $VendorDir | Out-Null

if (-not $SkipAssetDownload) {
    $assets = @{
        "xlsx.full.min.js" = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"
        "jspdf.umd.min.js" = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"
        "jspdf.plugin.autotable.min.js" = "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js"
    }
    foreach ($asset in $assets.GetEnumerator()) {
        $destination = Join-Path $VendorDir $asset.Key
        if (-not (Test-Path $destination)) {
            Invoke-WebRequest -Uri $asset.Value -OutFile $destination
        }
    }
}

Get-ChildItem $TesseractSource -Filter "*.dll" | Copy-Item -Destination $OcrTarget -Force
Copy-Item (Join-Path $TesseractSource "tesseract.exe") -Destination $OcrTarget -Force
$OcrTessdata = Join-Path $OcrTarget "tessdata"
New-Item -ItemType Directory -Force -Path $OcrTessdata | Out-Null
foreach ($language in "eng.traineddata", "osd.traineddata") {
    Copy-Item (Join-Path $TesseractSource "tessdata\$language") -Destination $OcrTessdata -Force
}
$SpaSource = Join-Path $TesseractSource "tessdata\spa.traineddata"
$SpaTarget = Join-Path $OcrTessdata "spa.traineddata"
if (Test-Path $SpaSource) {
    Copy-Item $SpaSource -Destination $SpaTarget -Force
} elseif (-not (Test-Path $SpaTarget)) {
    Invoke-WebRequest -Uri "https://github.com/tesseract-ocr/tessdata_fast/raw/main/spa.traineddata" -OutFile $SpaTarget
}

& $Python -m pip install --disable-pip-version-check pyinstaller
& $Python -m PyInstaller "$Root\desktop\ConsultaHabitacionalEP.spec" --noconfirm --clean --distpath "$BuildDir\desktop" --workpath "$BuildDir\pyinstaller-work"
if ($LASTEXITCODE -ne 0) { throw "PyInstaller no pudo crear el ejecutable." }

if (-not $SkipInstaller) {
    $IsccCandidates = @(
        "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
        "$env:ProgramFiles\Inno Setup 6\ISCC.exe",
        "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe"
    )
    $Iscc = $IsccCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
    if (-not $Iscc) {
        throw "No se encontro Inno Setup 6. Instala Inno Setup y vuelve a ejecutar build_installer.ps1."
    }
    & $Iscc "$Root\installer\ConsultaHabitacionalEP.iss"
    if ($LASTEXITCODE -ne 0) { throw "Inno Setup no pudo crear el instalador." }
}

Write-Host "Instalador creado en: $BuildDir\installer\ConsultaHabitacionalEP-Setup.exe"
