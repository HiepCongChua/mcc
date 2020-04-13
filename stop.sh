#!/bin/bash

# Stop
kill -9 `slc runctl status | head -n 1 | cut -d' ' -f3`

