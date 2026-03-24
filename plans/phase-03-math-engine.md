# Phase 3 — Math Engine

**Goal:** Pure function that generates correct, age-appropriate questions.

## Tasks

- [ ] 3.1 Create `generateQuestion(difficulty)` that returns `{ q: "3 + 4", a: 7 }`
  - **Easy:** `a + b`, a and b in [1, 10]
  - **Medium:** `a + b` or `a - b` (result ≥ 0), numbers in [1, 20]
  - **Hard:** `a × b` or `a ÷ b` (only clean integer division), numbers in [1, 12]

- [ ] 3.2 Add `randomInt(min, max)` helper utility function

- [ ] 3.3 For Hard division: generate `b` and `result` first, derive `a = b × result` to guarantee no remainders

- [ ] 3.4 Unit-test in browser console: call `generateQuestion('easy')` 10x and verify all answers are correct

## Question Format

```js
// Examples per difficulty
generateQuestion('easy')   // { q: "3 + 4",  a: 7  }
generateQuestion('medium') // { q: "15 - 8", a: 7  }
generateQuestion('hard')   // { q: "6 × 7",  a: 42 }
generateQuestion('hard')   // { q: "36 ÷ 6", a: 6  }
```

## Division Safety Rule
```
result = randomInt(1, 12)
b      = randomInt(1, 12)
a      = b × result          // always divisible, no remainders
```
