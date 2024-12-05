#!/bin/bash

# Runs the application on a server in the port defined in $PORT
# Use a proxy server like nginx to route calls from the primary domain to this for path /api
# To see the logs in action, run command tail -f logs/logs.log
# To kill the server, run command kill $(lsof -t -i :<PORT>)
# Or use the kill.sh script

current_datetime=$(date +%Y%m%d_%H%M%S)
logs_folder="logs"
log_file="$logs_folder/logs.log"

if [ ! -d "$logs_folder" ]; then
    mkdir "$logs_folder"
    echo "Created logs folder"
fi

if [ -f "$log_file" ]; then
    cp "$log_file" "$logs_folder/logs_${current_datetime}.log"
    echo "logs.log has been copied to $logs_folder/logs_${current_datetime}.log"
else
    echo "logs.log does not exist in the logs folder"
fi

export PORT=8087
npm install --prod > logs/logs.log     # Comment this line if no install module is required
node server.js >> logs/logs.log 2>&1 &