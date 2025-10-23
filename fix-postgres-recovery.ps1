# PostgreSQL pg_hba.conf Recovery Script
# This will restore a working pg_hba.conf file
# Run this as Administrator

Write-Host "PostgreSQL Recovery Script" -ForegroundColor Green
Write-Host "=========================`n" -ForegroundColor Green

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

$pgVersion = 13
$pgDataPath = "C:\Program Files\PostgreSQL\$pgVersion\data"
$pgHbaPath = "$pgDataPath\pg_hba.conf"
$backupPath = "$pgHbaPath.backup"

Write-Host "Stopping PostgreSQL service..." -ForegroundColor Yellow
try {
    Stop-Service -Name "postgresql-x64-$pgVersion" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "Service stopped" -ForegroundColor Green
} catch {
    Write-Host "Warning: Could not stop service (may already be stopped)" -ForegroundColor Yellow
}

# Create a working pg_hba.conf
Write-Host "`nCreating new pg_hba.conf file..." -ForegroundColor Yellow

$newConfig = @"
# PostgreSQL Client Authentication Configuration File
# ===================================================

# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
local   all             all                                     scram-sha-256

# IPv4 local connections:
host    all             all             127.0.0.1/32            trust

# IPv6 local connections:
host    all             all             ::1/128                 trust

# Allow replication connections from localhost, by a user with the
# replication privilege.
local   replication     all                                     scram-sha-256
host    replication     all             127.0.0.1/32            scram-sha-256
host    replication     all             ::1/128                 scram-sha-256
"@

try {
    # Backup corrupted file
    if (Test-Path $pgHbaPath) {
        Copy-Item $pgHbaPath "$pgHbaPath.corrupted" -Force
        Write-Host "Backed up corrupted file to: $pgHbaPath.corrupted" -ForegroundColor Cyan
    }
    
    # Write new config
    $newConfig | Out-File -FilePath $pgHbaPath -Encoding UTF8 -Force
    Write-Host "Created new pg_hba.conf" -ForegroundColor Green
    
} catch {
    Write-Host "ERROR: Failed to write config file" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Start PostgreSQL service
Write-Host "`nStarting PostgreSQL service..." -ForegroundColor Yellow
try {
    Start-Service -Name "postgresql-x64-$pgVersion"
    Start-Sleep -Seconds 3
    
    $serviceStatus = Get-Service -Name "postgresql-x64-$pgVersion"
    if ($serviceStatus.Status -eq "Running") {
        Write-Host "✓ PostgreSQL service started successfully!" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Service is not running. Status: $($serviceStatus.Status)" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} catch {
    Write-Host "ERROR: Failed to start PostgreSQL service" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Test connection
Write-Host "`nTesting connection (password not required now)..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

$env:PGPASSWORD = ""
$testResult = psql -U postgres -c "SELECT version();" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Connection successful!" -ForegroundColor Green
    
    # Set password
    Write-Host "`nSetting password to '8080'..." -ForegroundColor Yellow
    $pwResult = psql -U postgres -c "ALTER USER postgres WITH PASSWORD '8080';" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Password set successfully!" -ForegroundColor Green
        
        # Update config to use scram-sha-256
        Write-Host "`nUpdating to secure authentication..." -ForegroundColor Yellow
        
        $secureConfig = @"
# PostgreSQL Client Authentication Configuration File
# ===================================================

# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
local   all             all                                     scram-sha-256

# IPv4 local connections:
host    all             all             127.0.0.1/32            scram-sha-256

# IPv6 local connections:
host    all             all             ::1/128                 scram-sha-256

# Allow replication connections from localhost, by a user with the
# replication privilege.
local   replication     all                                     scram-sha-256
host    replication     all             127.0.0.1/32            scram-sha-256
host    replication     all             ::1/128                 scram-sha-256
"@
        
        $secureConfig | Out-File -FilePath $pgHbaPath -Encoding UTF8 -Force
        
        # Restart service
        Restart-Service -Name "postgresql-x64-$pgVersion" -Force
        Start-Sleep -Seconds 3
        
        Write-Host "✓ Configuration updated!" -ForegroundColor Green
        
        # Final test with password
        Write-Host "`nTesting with password..." -ForegroundColor Yellow
        $env:PGPASSWORD = "8080"
        $finalTest = psql -U postgres -c "SELECT 'Connection OK' as status;" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n========================================" -ForegroundColor Green
            Write-Host "SUCCESS! PostgreSQL is ready to use!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "`nYour PostgreSQL password is: 8080" -ForegroundColor Cyan
            Write-Host "`nTo connect:" -ForegroundColor Yellow
            Write-Host "  `$env:PGPASSWORD = '8080'" -ForegroundColor White
            Write-Host "  psql -U postgres" -ForegroundColor White
        } else {
            Write-Host "Warning: Password test failed" -ForegroundColor Yellow
            Write-Host "You may need to run: `$env:PGPASSWORD = '8080'" -ForegroundColor Cyan
        }
        
    } else {
        Write-Host "ERROR: Failed to set password" -ForegroundColor Red
    }
    
} else {
    Write-Host "ERROR: Connection test failed" -ForegroundColor Red
    Write-Host $testResult -ForegroundColor Red
}

Write-Host "`nPress Enter to exit..."
Read-Host
