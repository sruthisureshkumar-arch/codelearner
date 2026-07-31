# Linux Server Setup — Code Learner LMS

## 1. System Dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential gcc flex spim nodejs npm
```

> **Note:** If `nodejs`/`npm` from apt is outdated, install via nvm instead:
> ```bash
> curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
> source ~/.bashrc
> nvm install --lts
> ```

---

## 2. MongoDB

```bash
# Install MongoDB 7.0
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start and enable on boot
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify running
sudo systemctl status mongod
```

---

## 3. Ollama (AI Code Generation)

```bash
curl -fsSL https://ollama.com/install.sh | sh

# Pull the model used by the app
ollama pull qwen2.5-coder:1.5b

# Verify
ollama list
```

> Ollama runs on port 11434 by default. The app falls back to starter templates if Ollama is unavailable, so this step is optional.

---

## 4. Clone and Install the App

```bash
git clone <your-repo-url> code-learner-lms
cd code-learner-lms/lms-app

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

---

## 5. Environment Variables

Create `backend/.env`:

```bash
cat > backend/.env << 'EOF'
PORT=5001
MONGO_URI=mongodb://localhost:27017/lms
JWT_SECRET=your_secret_key_here
EOF
```

> Change `JWT_SECRET` to something long and random in production.

---

## 6. Build the Frontend (Production)

```bash
cd frontend
npm run build
```

This creates `frontend/build/` — a static folder to be served by nginx.

---

## 7. nginx (Serve Frontend + Proxy API)

```bash
sudo apt install -y nginx

sudo tee /etc/nginx/sites-available/lms << 'EOF'
server {
    listen 80;
    server_name _;

    # Serve React build
    root /path/to/code-learner-lms/lms-app/frontend/build;
    index index.html;

    # Proxy API calls to backend
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # SPA fallback — all other routes go to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/lms /etc/nginx/sites-enabled/lms
sudo nginx -t && sudo systemctl restart nginx
sudo systemctl enable nginx
```

> Replace `/path/to/code-learner-lms/...` with the actual path.

---

## 8. Run Backend with PM2 (Cluster Mode)

```bash
sudo npm install -g pm2

cd /path/to/code-learner-lms/lms-app/backend

# Cluster mode — spawns one process per CPU core for maximum concurrency
pm2 start ecosystem.config.js

# Save PM2 process list and auto-start on reboot
pm2 save
pm2 startup   # run the command it prints
```

---

## 8b. Self-Host Judge0 (Recommended for 100+ Students)

The default app uses the free hosted Judge0 (`ce.judge0.com`) which has rate limits. For a lab with many concurrent submissions, run Judge0 locally:

```bash
# Requires Docker
sudo apt install -y docker.io docker-compose
sudo systemctl enable --now docker

git clone https://github.com/judge0/judge0
cd judge0
cp judge0.conf.example judge0.conf

# Start Judge0 (this takes a few minutes the first time)
docker-compose up -d
```

Then uncomment this line in `backend/.env`:
```
JUDGE0_URL=http://localhost:2358/submissions?base64_encoded=false&wait=true
```

Restart the backend:
```bash
pm2 restart lms-backend
```

---

## 9. Seed Initial Questions (Optional)

```bash
cd /path/to/code-learner-lms/lms-app/backend
node seedQuestions.js
```

> Requires the backend to be running and course S2007 to exist.

---

## 10. Useful Commands

| Task | Command |
|------|---------|
| Check backend logs | `pm2 logs lms-backend` |
| Restart backend | `pm2 restart lms-backend` |
| Stop backend | `pm2 stop lms-backend` |
| MongoDB status | `sudo systemctl status mongod` |
| Restart MongoDB | `sudo systemctl restart mongod` |
| nginx status | `sudo systemctl status nginx` |
| Reload nginx config | `sudo nginx -s reload` |
| Kill port manually | `sudo lsof -ti:5001 \| xargs kill` |

---

## 11. Firewall (if enabled)

```bash
sudo ufw allow 80/tcp
sudo ufw allow 22/tcp   # SSH
sudo ufw enable
```

---

## Notes for Lab Deployment

- **Internet access required** for Judge0 (runs C/C++/Python/Java/JS code). MIPS and Flex run locally via `spim` and `flex`/`gcc`.
- **Ollama is optional** — the app falls back gracefully if it's not installed.
- Each lab machine needs steps 1–8. Step 9 (seeding) only needs to be done once on the machine where the database lives.
- If all lab machines share one server, only that server needs the full setup — students access via browser at the server's IP.
