# MGNREGA Codebase Cleanup Script
# This script safely deletes unused/obsolete files from the codebase
# Created: October 24, 2025

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "MGNREGA Codebase Cleanup Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Define the base path
$basePath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Define files to delete by category
$filesToDelete = @{
    "Backup Files" = @(
        "frontend\src\pages\Home_backup.jsx",
        "frontend\src\pages\Home_backup.css"
    )
    "Unused Routes & Controllers" = @(
        "backend\src\routes\states.js",
        "backend\src\routes\districts.js",
        "backend\src\routes\performance.js",
        "backend\src\routes\direct.js",
        "backend\src\controllers\stateController.js",
        "backend\src\controllers\districtController.js",
        "backend\src\controllers\performanceController.js",
        "backend\src\controllers\directApiController.js"
    )
    "Unused Services" = @(
        "backend\src\services\apiService.js",
        "backend\src\services\syncService.js",
        "backend\src\services\directApiService.js"
    )
    "Unused Models" = @(
        "backend\src\models\State.js",
        "backend\src\models\District.js",
        "backend\src\models\Performance.js"
    )
    "Test & Seed Scripts" = @(
        "backend\test-sync.js",
        "backend\src\scripts\seedData.js"
    )
    "Database SQL Files" = @(
        "database\schema.sql",
        "database\insert_districts.sql"
    )
    "Docker & Setup Files" = @(
        "docker-compose.yml",
        "fix-postgres-password.ps1",
        "fix-postgres-recovery.ps1",
        "setup.sh"
    )
    "Documentation Files" = @(
        "FINAL_CHECKLIST.md",
        "DEPLOYMENT.md",
        "PROJECT_SUMMARY.md",
        "SETUP_GUIDE.md",
        "LOOM_VIDEO_GUIDE.md"
    )
}

# Display what will be deleted
Write-Host "The following files will be DELETED:" -ForegroundColor Yellow
Write-Host ""

$totalFiles = 0
foreach ($category in $filesToDelete.Keys) {
    Write-Host "📁 $category" -ForegroundColor Magenta
    foreach ($file in $filesToDelete[$category]) {
        $fullPath = Join-Path $basePath $file
        if (Test-Path $fullPath) {
            Write-Host "  ✓ $file" -ForegroundColor Green
            $totalFiles++
        } else {
            Write-Host "  ✗ $file (not found)" -ForegroundColor DarkGray
        }
    }
    Write-Host ""
}

Write-Host "Total files to delete: $totalFiles" -ForegroundColor Cyan
Write-Host ""

# Ask for confirmation
$confirmation = Read-Host "Do you want to proceed with deletion? (yes/no)"

if ($confirmation -ne "yes") {
    Write-Host "Cleanup cancelled." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Starting cleanup..." -ForegroundColor Green
Write-Host ""

# Delete files
$deletedCount = 0
$failedCount = 0

foreach ($category in $filesToDelete.Keys) {
    Write-Host "Processing: $category" -ForegroundColor Cyan
    foreach ($file in $filesToDelete[$category]) {
        $fullPath = Join-Path $basePath $file
        if (Test-Path $fullPath) {
            try {
                Remove-Item -Path $fullPath -Force
                Write-Host "  ✓ Deleted: $file" -ForegroundColor Green
                $deletedCount++
            } catch {
                Write-Host "  ✗ Failed to delete: $file" -ForegroundColor Red
                Write-Host "    Error: $_" -ForegroundColor Red
                $failedCount++
            }
        }
    }
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Cleanup Summary" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "✓ Successfully deleted: $deletedCount files" -ForegroundColor Green
if ($failedCount -gt 0) {
    Write-Host "✗ Failed to delete: $failedCount files" -ForegroundColor Red
}
Write-Host ""

# Clean up empty directories
Write-Host "Checking for empty directories..." -ForegroundColor Cyan

$emptyDirs = @(
    "database"
)

foreach ($dir in $emptyDirs) {
    $dirPath = Join-Path $basePath $dir
    if (Test-Path $dirPath) {
        $items = Get-ChildItem -Path $dirPath -Recurse
        if ($items.Count -eq 0) {
            try {
                Remove-Item -Path $dirPath -Force -Recurse
                Write-Host "  ✓ Removed empty directory: $dir" -ForegroundColor Green
            } catch {
                Write-Host "  ✗ Failed to remove directory: $dir" -ForegroundColor Red
            }
        }
    }
}

Write-Host ""
Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Please rebuild your project after cleanup:" -ForegroundColor Yellow
Write-Host "  1. Backend: cd backend && npm install" -ForegroundColor White
Write-Host "  2. Frontend: cd frontend && npm install" -ForegroundColor White
Write-Host "  3. Test the application to ensure everything works" -ForegroundColor White
Write-Host ""
