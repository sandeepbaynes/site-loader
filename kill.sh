#!/bin/bash

# Script kills the server process if it is running

PORT=8087
LOG_FILE="logs/logs.log"

PID=$(lsof -t -i :$PORT)

if [ -z "$PID" ]; then
  echo "No process is running on port $PORT." >> $LOG_FILE
else
  kill -9 $PID
  echo "Process on port $PORT (PID: $PID) has been terminated." >> $LOG_FILE
fi
