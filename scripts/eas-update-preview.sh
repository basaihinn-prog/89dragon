#!/bin/bash
echo "Publishing OTA update to preview branch..."
npx eas update --branch preview --message "Update from Replit"
