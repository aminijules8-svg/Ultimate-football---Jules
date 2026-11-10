#!/bin/bash
cd "$(dirname "$0")"
echo "Starting FC26 Ultimate Football..."
npm run dev --host &
sleep 2
echo ""
echo "=================================================="
echo "🎮 FC26 Ultimate Football is running locally!"
echo "To share with friends on your Wi-Fi, open:"
echo "👉 http://$(hostname -I | awk '{print $1}'):2000"
echo "=================================================="
