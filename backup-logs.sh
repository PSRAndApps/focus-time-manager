#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp focus_sessions.log "backups/focus_sessions_$DATE.log"
find backups/ -name "*.log" -mtime +30 -delete
echo "Backup created: focus_sessions_$DATE.log"
