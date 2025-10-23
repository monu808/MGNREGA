# PostgreSQL Password Reset Script
# Run this as Administrator

Write-Host "PostgreSQL Password Reset Utility" -ForegroundColor Green
Write-Host "==================================`n" -ForegroundColor Green

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Find PostgreSQL installation
$pgVersion = 13  # Change this if you have a different version
$pgDataPath = "C:\Program Files\PostgreSQL\$pgVersion\data"
$pgHbaPath = "$pgDataPath\pg_hba.conf"

if (-not (Test-Path $pgHbaPath)) {
    Write-Host "ERROR: Could not find pg_hba.conf at $pgHbaPath" -ForegroundColor Red
    Write-Host "Please check your PostgreSQL installation path." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Found PostgreSQL $pgVersion installation" -ForegroundColor Cyan
Write-Host "Config file: $pgHbaPath`n" -ForegroundColor Cyan

# Backup original file
$backupPath = "$pgHbaPath.backup"
Copy-Item $pgHbaPath $backupPath -Force
Write-Host "Created backup: $backupPath" -ForegroundColor Green

# Read and modify pg_hba.conf
$content = Get-Content $pgHbaPath
$modified = $content -replace 'scram-sha-256', 'trust' -replace 'md5', 'trust'
$modified | Set-Content $pgHbaPath

Write-Host "Modified pg_hba.conf to use 'trust' authentication" -ForegroundColor Green

# Restart PostgreSQL service
$serviceName = "postgresql-x64-$pgVersion"
Write-Host "`nRestarting PostgreSQL service..." -ForegroundColor Yellow

try {
    Restart-Service -Name $serviceName -Force
    Start-Sleep -Seconds 3
    Write-Host "PostgreSQL service restarted successfully!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to restart PostgreSQL service" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Test connection
Write-Host "`nTesting connection..." -ForegroundColor Yellow
$testResult = psql -U postgres -c "SELECT version();" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Connection successful!" -ForegroundColor Green
    
    # Set new password
    Write-Host "`nSetting new password to '8080'..." -ForegroundColor Yellow
    $result = psql -U postgres -c "ALTER USER postgres WITH PASSWORD '8080';" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Password changed successfully!" -ForegroundColor Green
        
        # Restore original authentication method
        Write-Host "`nRestoring original authentication method..." -ForegroundColor Yellow
        $originalContent = Get-Content $backupPath
        $originalContent | Set-Content $pgHbaPath
        
        # Restart again
        Restart-Service -Name $serviceName -Force
        Start-Sleep -Seconds 3
        Write-Host "✓ Configuration restored!" -ForegroundColor Green
        
        Write-Host "`n========================================" -ForegroundColor Green
        Write-Host "SUCCESS! Password has been set to: 8080" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "`nYou can now connect using:" -ForegroundColor Cyan
        Write-Host "  psql -U postgres" -ForegroundColor White
        Write-Host "  Password: 8080" -ForegroundColor White
        
    } else {
        Write-Host "ERROR: Failed to change password" -ForegroundColor Red
    }
    
} else {
    Write-Host "ERROR: Connection test failed" -ForegroundColor Red
    Write-Host $testResult -ForegroundColor Red
}

Write-Host "`nPress Enter to exit..."
Read-Host
