# Focus Time Manager

A productivity app to help you manage your focus sessions. Built with a Node.js Express backend and a React frontend.

## Features

- Start, pause, and stop focus sessions
- Track session history and statistics
- User authentication
- Responsive UI

## Tech Stack

- **Backend:** Node.js, Express
- **Frontend:** React
- **Database:** (Add your choice, e.g., MongoDB, PostgreSQL)

## Getting Started

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## License

MIT

USEFUL COMMANDS AFTER DEPLOYMENT
# ===============================================
# Check application status: pm2 status
# View real-time logs: pm2 logs focus-app
# Restart application: pm2 restart focus-app
# View session data: tail -f focus_sessions.log
# Check Caddy status: sudo systemctl status caddy
# Reload Caddy config: sudo systemctl reload caddy
# Export session data: curl https://focus.yourdomain.com/api/export > sessions.json