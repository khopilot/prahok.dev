#!/bin/bash
# Wrapper script to ensure Claude Code uses Node.js instead of bun

# Set environment variables
export CLAUDE_CODE_RUNTIME="node"
export NODE_ENV="production"

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

# Run the Node.js script that wraps Claude Code
node "$@"