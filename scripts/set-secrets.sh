#!/usr/bin/env bash
# Set this Worker's secrets on Cloudflare. Prompts for each value (input hidden);
# press Enter to skip one. Run after `npx cf auth login`.
set -euo pipefail
WORKER=lending-intelligence-terminal
for name in DATABASE_URL ETH_RPC_URL LIQUIDATOR_DATABASE_URL CRON_SECRET BEEHIIV_API_KEY BEEHIIV_PUBLICATION_ID; do
  read -r -s -p "$name: " value; echo
  [ -z "$value" ] && { echo "  skipped"; continue; }
  npx cf workers secrets update "$name" --worker "$WORKER" --type secret_text --text "$value" -q >/dev/null && echo "  set"
done
