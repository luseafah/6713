#!/bin/sh
# Simple wrapper to execute Python deployment script

cd "$(dirname "$0")"
python3 deploy.py
