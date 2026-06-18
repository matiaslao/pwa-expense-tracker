# Task Report

## Task
TASK-002: Domain — Purchase Entity

## Objective
Implement the Purchase entity and Installment value object in the domain layer with ARS-only currency enforcement.

## Files Modified
- `src/domain/types.ts` — Currency type alias (`type Currency = 'ARS'`)
- `src/domain/entities/Installment.ts` — Installment value object interface (`number`, `dueDate`, `amount`)
- `src/domain/entities/Purchase.ts` — Purchase entity class with validation, installment generation, and remaining installment calculation
- `src/domain/entities/__tests__/Installment.test.ts` — 3 unit tests
- `src/domain/entities/__tests__/Purchase.test.ts` — 23 unit tests

## Tests Executed
- `npm run test` — 26 tests passed across 2 files
- Coverage: creation, validation (9 error cases), installment generation (7 cases), remaining installments (3 cases)

## Build Result
- `npm run build` — passes

## Known Issues
- None

## Next Recommended Task
TASK-003: Domain — Billing Period
