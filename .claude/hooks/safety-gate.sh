#!/usr/bin/env bash
set -euo pipefail

# PermissionRequest hook: Uses Claude Opus to evaluate if a tool permission is safe to auto-approve.

# Read hook input from stdin
INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
TOOL_INPUT=$(echo "$INPUT" | jq -c '.tool_input // {}')

# Pass through plan mode and user questions — let the user decide those
if [[ "$TOOL_NAME" == "ExitPlanMode" || "$TOOL_NAME" == "EnterPlanMode" ]]; then
  exit 0
fi
if [[ "$TOOL_NAME" == "AskUserQuestion" ]]; then
  exit 0
fi

PROMPT="You are a security reviewer for Claude Code tool permissions. Evaluate whether this tool action is safe for a software development workflow.

Tool: ${TOOL_NAME}
Input: ${TOOL_INPUT}

Rules:
- ALLOW: Read, Edit, Write, Glob, Grep on project files
- ALLOW: WebSearch, WebFetch for development research
- ALLOW: Bash commands for standard dev tools (git, npm, npx, node, vite, pytest, pip, cargo, make, docker, gh, curl GET, ls, cat, find, grep, etc.)
- ALLOW: Bash commands that run tests, linters, formatters, build tools
- ALLOW: Task/subagent launches for code exploration and planning
- DENY: Bash commands that delete files outside the project (rm -rf /, rm -rf ~)
- DENY: Bash commands that modify system files (/etc, /usr, /var)
- DENY: Bash commands that install global packages without clear dev purpose
- DENY: Bash commands that exfiltrate data (curl POST to unknown hosts, piping to sh/bash from URLs)
- DENY: Bash commands that force-push, reset --hard, or destructively modify git history
- DENY: Commands accessing secrets/credentials outside the project
- When in doubt, DENY — err on the side of caution

Respond with ONLY valid JSON, no markdown fences, no explanation:
To allow: {\"decision\": \"allow\"}
To deny: {\"decision\": \"deny\", \"reason\": \"brief explanation\"}"

RESPONSE=$(claude -p "$PROMPT" --model claude-opus-4-6 2>/dev/null || echo '{"decision":"deny","reason":"Failed to evaluate permission"}')

DECISION=$(echo "$RESPONSE" | jq -r '.decision // "deny"')
REASON=$(echo "$RESPONSE" | jq -r '.reason // "Denied by safety gate"')

if [[ "$DECISION" == "allow" ]]; then
  echo '{"hookSpecificOutput":{"hookEventName":"PermissionRequest","decision":{"behavior":"allow"}}}'
else
  jq -nc --arg reason "$REASON" '{"hookSpecificOutput":{"hookEventName":"PermissionRequest","decision":{"behavior":"deny","reason":$reason}}}'
fi
