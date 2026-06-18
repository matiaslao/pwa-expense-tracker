# AGENT_RULES.md

# Agent Operating Rules

Version: 1.0

Applies to:

* OpenCode
* Claude Code
* Aider
* Local Coding Agents

---

# Mission

The agent is responsible for implementing the project defined in:

* ProductSpecification.md
* ArchitectureDecisionRecords.md
* TaskGenerationRules.md
* PROJECT_STATE.md

The agent must follow the specifications exactly.

The agent is not allowed to redefine project scope.

---

# Primary Objectives

Priority order:

1. Correct business logic
2. Simplicity
3. Maintainability
4. Testability
5. User experience
6. Development speed

---

# Execution Workflow

The agent shall:

1. Read all specification files.
2. Read PROJECT_STATE.md.
3. Determine current task.
4. Execute only the requested task.
5. Update PROJECT_STATE.md.
6. Generate task report.
7. Stop.

The agent must never continue to the next task automatically.

---

# Scope Control

The agent must not:

* Execute multiple tasks.
* Execute future tasks.
* Modify unrelated modules.
* Refactor unrelated code.
* Add features not defined in specifications.

If uncertainty exists:

Stop and request clarification.

---

# File Modification Limits

Maximum files modified per task:

3

Preferred:

1-2

If a task requires more than 3 files:

Explain why and stop.

---

# Architecture Rules

The project follows Clean Architecture.

Allowed dependencies:

Presentation
→ Application

Application
→ Domain

Infrastructure
→ Domain

Forbidden dependencies:

Domain
→ React

Domain
→ IndexedDB

Domain
→ Material UI

Application
→ React

Application
→ Dexie

The Domain layer must remain framework-independent.

---

# Business Logic Rules

Business rules must only exist inside:

* Domain Layer
* Application Layer

Business logic must never exist inside:

* React Components
* Pages
* UI Hooks

Forbidden examples:

* Installment calculations inside React
* Billing period calculations inside React
* Future commitment calculations inside React

---

# Persistence Rules

All persistence must occur through repositories.

Forbidden:

Direct IndexedDB access from:

* Components
* Pages
* Domain

Only Infrastructure may interact with Dexie.

---

# Testing Rules

Every new business rule requires tests.

Every new service requires tests.

Every bug fix requires a regression test.

Coverage target:

90%+

The agent must not disable tests.

The agent must not remove tests to make builds pass.

---

# Build Verification

After every task execute:

npm run build

If tests exist:

npm run test

Report results.

---

# Documentation Rules

Documentation is mandatory.

When code changes:

Update documentation if affected.

Minimum documents:

* README.md
* Architecture.md
* UserGuide.md
* PROJECT_STATE.md

---

# Git Rules

Recommended workflow:

One commit per task.

Commit message format:

TASK-XXX: Short description

Examples:

TASK-012: Implement Purchase entity

TASK-018: Add BillingPeriodCalculator tests

Do not create large commits.

---

# Reporting Rules

After every task generate:

TaskReport.md

Required sections:

## Task

## Objective

## Files Modified

## Tests Executed

## Build Result

## Known Issues

## Next Recommended Task

---

# Error Handling

If build fails:

Stop.

If tests fail:

Stop.

If architecture violation is detected:

Stop.

If requirements are ambiguous:

Stop.

Do not attempt speculative fixes.

---

# Refactoring Rules

Refactoring is allowed only if:

* Related to current task.
* Improves maintainability.
* Does not change behavior.

Large refactors require approval.

---

# Performance Rules

Avoid premature optimization.

Prioritize:

* Correctness
* Readability
* Simplicity

before optimization.

---

# Security Rules

Do not introduce:

* Authentication
* User management
* Cloud services
* Analytics
* Telemetry

unless explicitly requested.

---

# Completion Criteria

A task is complete only if:

* Code compiles.
* Tests pass.
* Documentation updated.
* PROJECT_STATE.md updated.
* Task report generated.

Only then may the task be considered finished.
