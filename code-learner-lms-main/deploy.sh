#!/bin/bash
##############################################################################
# deploy.sh — One-command deployment for LMS (offline Linux server)
#
# Usage (first time):   bash deploy.sh --setup
# Usage (update):       bash deploy.sh
#
# Run as the user who owns the app (not root).
##############################################################################

set -e  # exit on any error

APP_DIR="$(cd "$(dirname "$0")/lms-app" && pwd)"
BACKEND="$APP_DIR/backend"
FRONTEND="$APP_DIR/frontend"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[deploy]${NC} $1"; }
warn()  { echo -e "${YELLOW}[warn]${NC}  $1"; }
error() { echo -e "${RED}[error]${NC} $1"; exit 1; }

# ── Preflight checks ──────────────────────────────────────────────────────────
command -v node  >/dev/null || error "Node.js not found. Install with: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs"
command -v pm2   >/dev/null || error "PM2 not found. Install with: npm install -g pm2"
command -v nginx >/dev/null || warn  "nginx not found — frontend won't be served. Install: sudo apt install -y nginx"

# ── First-time setup ──────────────────────────────────────────────────────────
if [[ "$1" == "--setup" ]]; then
    info "=== First-time setup ==="

    # ulimits
    if ! grep -q "nofile 65536" /etc/security/limits.conf 2>/dev/null; then
        echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
        echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf
        info "ulimits set to 65536"
    fi

    # MongoDB
    if ! command -v mongod >/dev/null; then
        warn "MongoDB not found — install it manually or via docker"
    else
        sudo systemctl enable mongod && sudo systemctl start mongod
        info "MongoDB started"
    fi

    # nginx config
    if command -v nginx >/dev/null; then
        sudo cp "$(dirname "$0")/nginx.conf" /etc/nginx/sites-available/lms
        sudo ln -sf /etc/nginx/sites-available/lms /etc/nginx/sites-enabled/lms
        sudo rm -f /etc/nginx/sites-enabled/default
        sudo nginx -t && sudo systemctl enable nginx && sudo systemctl start nginx
        info "nginx configured"
    fi

    # Judge0 (Docker required)
    if command -v docker >/dev/null; then
        JUDGE0_DIR="$(dirname "$0")/judge0"
        if [[ ! -d "$JUDGE0_DIR" ]]; then
            mkdir -p "$JUDGE0_DIR"
            curl -fsSL https://github.com/judge0/judge0/releases/download/v1.13.1/judge0-v1.13.1.zip \
                -o "$JUDGE0_DIR/judge0.zip" && unzip -q "$JUDGE0_DIR/judge0.zip" -d "$JUDGE0_DIR"
            info "Judge0 downloaded — edit $JUDGE0_DIR/judge0-v1.13.1/.env then run: cd $JUDGE0_DIR/judge0-v1.13.1 && docker compose up -d"
        fi
    else
        warn "Docker not found — Judge0 self-hosting requires Docker"
    fi

    info "=== Setup complete. Now edit lms-app/backend/.env then run: bash deploy.sh ==="
    exit 0
fi

# ── Check .env ────────────────────────────────────────────────────────────────
[[ -f "$BACKEND/.env" ]] || error "Missing $BACKEND/.env — copy .env.example and fill in values"
source "$BACKEND/.env"
[[ -z "$MONGODB_URI" ]]  && error "MONGODB_URI not set in .env"
[[ -z "$JWT_SECRET" ]]   && warn  "JWT_SECRET not set — using insecure fallback"
[[ -z "$JUDGE0_URL" ]]   && warn  "JUDGE0_URL not set — code execution will fail on offline server"
[[ -z "$FRONTEND_URL" ]] && warn  "FRONTEND_URL not set — CORS will allow all origins"

# ── Backend ───────────────────────────────────────────────────────────────────
info "Installing backend dependencies..."
cd "$BACKEND" && npm install --omit=dev

info "Starting backend with PM2..."
pm2 describe lms-backend >/dev/null 2>&1 \
    && pm2 reload ecosystem.config.js --update-env \
    || pm2 start ecosystem.config.js
pm2 save

# ── Frontend ──────────────────────────────────────────────────────────────────
info "Building frontend..."
cd "$FRONTEND"

# REACT_APP_API_URL must be empty when nginx proxies /api on the same host
# If your frontend and backend are on DIFFERENT hosts, set this to the backend URL
REACT_APP_API_URL="" npm run build

# ── nginx reload ──────────────────────────────────────────────────────────────
if command -v nginx >/dev/null && systemctl is-active --quiet nginx; then
    sudo nginx -t && sudo systemctl reload nginx
    info "nginx reloaded"
fi

info "=== Deployment complete ==="
echo ""
echo "  Backend:  http://localhost:5001/api/health"
echo "  Frontend: http://$(hostname -I | awk '{print $1}') (via nginx on port 80)"
echo ""
echo "  Logs:     pm2 logs lms-backend"
echo "  Monitor:  pm2 monit"
