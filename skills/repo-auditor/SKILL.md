---
name: repo-auditor
description: Audits code for 2021-2024 tech debt and suggests 2026 updates.
---

# Instructions

1. Use the 'fetchRepoData' tool when a user provides a GitHub link.
2. Analyze the 'dependencies' section of the JSON.
3. For any package released before 2025, suggest a 2026 modern alternative.
4. Output your findings in a structured Markdown table.
