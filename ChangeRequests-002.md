Read:

- ProductSpecification.md
- ArchitectureDecisionRecords.md
- PROJECT_STATE.md
- AGENT_RULES.md

Implement CR-002.

Problem 1:
Dashboard does not refresh after settings changes. For example, after updating Closing Day, Dashboard is not automatically updated with new values.

Expected:
Dashboard calculations must update immediately after settings are saved.

Problem 2:
Due Date automatic calculation is incorrect when Closing Day + 14 exceeds the current month length.

Expected:
Due Date shall be calculated using real calendar arithmetic. Since Due Date and Closing Date might be on different moths, they must be shown in day/month format.

Examples:

20/6 -> 4/7
25/6 -> 8/7

Do not use simple integer addition.

Requirements:

- Analyze modifications from this CR impact in exisiting codebase.
- Generate CR002_Report.md.
- Do NOT modify any existing file.

Stop after completion.
