#!/bin/bash

echo "Testing API with debug mode..."
curl -X POST http://localhost:8787/api/compare?debug=1 \
  -H "Content-Type: application/json" \
  -d '{
    "fromChainId": 1,
    "toChainId": 42161,
    "token": "USDC",
    "amount": "1000",
    "slippage": "0.01"
  }' | jq '.'