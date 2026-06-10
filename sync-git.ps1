# AstraCare Auto-Sync Script for GitHub
$gitPath = "C:\Program Files\Git\cmd\git.exe"

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "     AstraCare Auto Git Sync Agent Active      " -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Watching Directory: Z:\Hospital appointment booking"
Write-Host "Remote Repository:  https://github.com/Dhonibaptist/HOSPITAL"
Write-Host "Checking for file updates every 10 seconds..."
Write-Host "-----------------------------------------------"

while ($true) {
    # Check git status for any modified or untracked files
    $status = & $gitPath status --porcelain
    
    if ($status) {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Change detected! Syncing with GitHub..." -ForegroundColor Yellow
        
        # Stage all changes
        & $gitPath add .
        
        # Commit with current timestamp
        $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        & $gitPath commit -m "Auto-commit at $timestamp"
        
        # Push to main branch on GitHub
        Write-Host "Pushing updates to GitHub main branch..." -ForegroundColor Gray
        $pushResult = & $gitPath push origin main 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
        } else {
            Write-Host "Push failed. Make sure you have authorized Git credentials." -ForegroundColor Red
            Write-Host $pushResult -ForegroundColor DarkGray
        }
        Write-Host "-----------------------------------------------"
    }
    
    # Wait for 10 seconds before next check
    Start-Sleep -Seconds 10
}
