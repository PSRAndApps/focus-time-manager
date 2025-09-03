#!/bin/bash
if ! pm2 list | grep -q focus-app; then
    echo "Focus app is down, restarting..."
    pm2 start server.js --name focus-app
    pm2 save
fi
EOF

chmod +x monitor.sh
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/ubuntu/focus-time-manager/monitor.sh") | crontab -

echo "==============================================="
echo "✅ APPLICATION SETUP COMPLETE!"
echo "==============================================="
echo "Next steps:"
echo "1. Configure DNS in GoDaddy (see instructions below)"
echo "2. Test: http://focus.yourdomain.com"
echo "3. Setup SSL: sudo certbot --nginx -d focus.yourdomain.com"
echo "4. Monitor logs: tail -f focus_sessions.log"
echo "5. Check app status: pm2 status"
echo "==============================================="