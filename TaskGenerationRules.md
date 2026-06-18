# Task Generation Rules

The agent shall generate tasks before implementation.

Inputs:
- ProductSpecification.md
- ArchitectureDecisionRecords.md
- PROJECT_STATE.md
- AGENT_RULES.md

Tasks must:
- Modify <= 5 files
- Be independently executable
- Include acceptance criteria
- Include testing requirements

Output:
TaskList.md

Do not implement code.

Execution flow:
1. Generate TaskList.md
2. Wait for approval
3. Execute one task at a time
4. Update PROJECT_STATE.md
5. Generate task report
6. Stop
