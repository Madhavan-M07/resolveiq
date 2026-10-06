# ResolveIQ One-Click Development Launcher (All 3 Services)
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       Starting ResolveIQ Autonomous SRE Platform         " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

# 1. Start Backend API Gateway (Port 4000)
Write-Host "[1/3] Launching resolveiq-api on port 4000 (Express & Neon DB)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\apps\resolveiq-api'; Write-Host '--- ResolveIQ Backend Gateway (Port 4000) ---' -ForegroundColor Green; npm run dev"

# 2. Start AI Brain Engine (Port 8000)
Write-Host "[2/3] Launching resolveiq-ai on port 8000 (LangGraph & Gemini)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\apps\resolveiq-ai'; Write-Host '--- ResolveIQ AI Brain (Port 8000) ---' -ForegroundColor Magenta; python -m uvicorn src.server:app --port 8000 --reload"

# 3. Start Frontend Web Command Center (Port 3000)
Write-Host "[3/3] Launching resolveiq-web on port 3000 (Next.js 15)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\apps\resolveiq-web'; Write-Host '--- ResolveIQ Web Command Center (Port 3000) ---' -ForegroundColor Cyan; npm run dev"

Write-Host "`nAll 3 services launched successfully!" -ForegroundColor Green
Write-Host "-> Web Dashboard : http://localhost:3000" -ForegroundColor Cyan
Write-Host "-> Backend API   : http://localhost:4000/api/v1" -ForegroundColor Green
Write-Host "-> AI Engine     : http://localhost:8000" -ForegroundColor Magenta
