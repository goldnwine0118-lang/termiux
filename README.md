# Termiux

A self-hosted PWA terminal that gives you a real, persistent shell on your Linux machine from your phone. Sessions survive phone lock via tmux. No app store needed — install from the browser.

## Quick Start

### Prerequisites (once)

```bash
sudo apt install build-essential tmux
node --version   # must be 22.12+ (required by the Vite 8 / Vitest 5 build and test tooling)
```

### Setup

```bash
git clone https://github.com/sahilsinghM/termiux.git
cd termiux
npm install

# Verify node-pty compiled correctly
node -e "require('node-pty'); console.log('node-pty OK')"

cp .env.example .env
nano .env   # Set AUTH_TOKEN to a long random string:
            # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

npm run build
npm start
# ✓ Termiux listening on http://localhost:3000
```

### HTTPS with Caddy (required for PWA install)

```
# /etc/caddy/Caddyfile
your-domain.com {
    reverse_proxy localhost:3000
}
```

```bash
sudo systemctl restart caddy
```

Caddy auto-provisions a Let's Encrypt certificate. No certbot needed.

**No public IP? Use Tailscale instead:**

```
# /etc/caddy/Caddyfile
your-machine.ts.net {
    reverse_proxy localhost:3000
}
```

Install Tailscale on both your server and phone. Caddy uses Tailscale's ACME to get a cert for your `.ts.net` hostname. No port forwarding required.

### Add to Home Screen

- **iOS Safari:** tap Share → **Add to Home Screen**
- **Android Chrome:** tap ⋮ → **Install App**

### Keep it running (systemd)

```ini
# /etc/systemd/system/termiux.service
[Unit]
Description=Termiux PWA Terminal
After=network.target

[Service]
WorkingDirectory=/path/to/termiux
ExecStart=/usr/bin/node server.js
Restart=always
EnvironmentFile=/path/to/termiux/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now termiux
```

## Magical Moment Test

After setup, open the terminal on your phone. Run:

```bash
sleep 300 &
```

Lock your phone. Wait 5 minutes. Unlock and tap the Termiux icon. The session reconnects and shows `[1] sleep` still running in the background. That's tmux keeping your session alive while iOS had suspended the PWA.

## Post-Deploy Checklist

- [ ] `AUTH_TOKEN` is a long random string (not the example placeholder)
- [ ] HTTPS cert is valid — no warnings in browser
- [ ] "Add to Home Screen" works on iOS Safari and Android Chrome
- [ ] Lock phone → wait 2 min → unlock → reconnects automatically
- [ ] Ctrl+C via the key row kills a running process
- [ ] `vim` and `htop` render correctly on the phone screen

## ARM / Raspberry Pi

If `node-pty` fails to compile:

```bash
npm install --unsafe-perm
node -e "require('node-pty'); console.log('node-pty OK')"
```

## Development

```bash
cp .env.example .env
# Set NODE_ENV=development in .env
npm run dev   # starts backend (nodemon) + Vite dev server concurrently
```

## Testing

```bash
npm test           # vitest unit tests
npm run test:e2e   # Playwright E2E (requires a running server)
```
