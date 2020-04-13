#!/bin/bash

# Stop
kill -9 `slc runctl status | head -n 1 | cut -d' ' -f3`

# Start
slc run --cluster 1 -d -l ./logs/daemon.log

# Read log
tail -f ./logs/daemon.log
 