---
layout: doc
editLink: true
---

[@textmode/runner-client](../index.md) / RunnerRequestError

# Class: RunnerRequestError

Error used when a request-scoped runner execution fails.

## Extends

- `Error`

## Implements

- [`RunnerExecutionError`](../interfaces/RunnerExecutionError.md)

## Constructors

### Constructor

```ts
new RunnerRequestError(message): RunnerRequestError;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | `RunErrorMessage` |

#### Returns

`RunnerRequestError`

#### Overrides

```ts
Error.constructor
```

## Properties

### line?

```ts
readonly optional line?: number;
```

Optional 1-based source line.

#### Implementation of

[`RunnerExecutionError`](../interfaces/RunnerExecutionError.md).[`line`](../interfaces/RunnerExecutionError.md#property-line)

***

### column?

```ts
readonly optional column?: number;
```

Optional 1-based source column.

#### Implementation of

[`RunnerExecutionError`](../interfaces/RunnerExecutionError.md).[`column`](../interfaces/RunnerExecutionError.md#property-column)

***

### requestId?

```ts
readonly optional requestId?: string;
```

Request identifier that produced the error.
