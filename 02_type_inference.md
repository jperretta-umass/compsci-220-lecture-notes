# Type Inference

This lesson discusses the mechanices of type inference, generic types, and how they interact.

**Table of Contents**
1. [Type Inference](#type-inference)
1. [How generic type parameters work](#how-generic-type-parameters-work)
    1. [Type inference in TypeScript](#type-inference-in-typescript)
        1. [Inferring variable types](#inferring-variable-types)
        1. [Inferring return types](#inferring-return-types)
        1. [Inferring generic type variable substitutions](#inferring-generic-type-variable-substitutions)
        1. [Inferring function parameter types](#inferring-function-parameter-types)
        1. [Inferring the type of an arrow function](#inferring-the-type-of-an-arrow-function)
1. [Inferring types with `Array.map` & `Array.filter`](#inferring-types-with-arraymap--arrayfilter)
    1. [`Array.map` and `Array.filter`](#arraymap-and-arrayfilter)
        1. [Combining the two](#combining-the-two)
        1. [Solution](#solution)
        1. [Fixing the mistake](#fixing-the-mistake)
        1. [Solution](#solution-1)

# How generic type parameters work

Below is another version of the `map` function.
Its signature (parameter and return types) is the same, but it uses an index-style loop so that we can illustrate some other points.

```typescript
function map<InputType, OutputType>(
  data: InputType[],
  // func is a function that takes in one argument of type InputType
  // and returns a value of type OutputType
  func: (item: InputType) => OutputType
): OutputType[] {
  let result: OutputType[] = [];
  for (let i = 0; i < data.length; ++i) {
    result.push(func(data[i]));
  }
  return result;
}
```

`InputType` and `OutputType` are _generic type parameters_.
You can think of them as placeholders that we will replace with actual types when we call this function.

Let's write a new function `stringify` that takes an array of numbers and returns an array of those values converted to strings.

```typescript
function stringify(nums: number[]): string[] {
  return map<number, string>(nums, numToString);
}

function numToString(num: number): string {
  return num.toString();
}
```

In our call to `map`, We explicitly specified what the generic type parameters should be replaced with.
Think of it as if the compiler made a copy of the code for `map` and replaced `InputType` and `OutputType` with `number` and `string`:

```typescript
function map_substituted<number, string>(
  data: number[],
  func: (item: number) => string
): string[] {
  let result: string = [];
  for (let i = 0; i < data.length; ++i) {
    result.push(func(data[i]));
  }
  return result;
}
```

Then, the compiler looks for type errors.
For example, it makes sure that the return type of `func` matches the type of the values in the `data` array.
In this case those types are both `number`, so the code is valid.

## Type inference in TypeScript

In many contexts, the Typescript compiler can automatically "infer" or "deduce" (i.e., "figure out") what the type of a declared variable (or even function) should be.
The key is to start with the smallest parts that we know the type of, and then build on that as those types are used.
The next few sections go through examples of where Typescript will or won't deduce types for us.

### Inferring variable types

In our for loop in `map`, notice that we did not explicitly specify the type for `i`:

```typescript
for (let i = 0; i < data.length; ++i) {
    ...
}
```

The Typescript compiler can deduce the type of a variable from the type of the _literal_ value the variable is initialized with.

Going a step further, the compiler can deduce the type of a variable as long as it knows the type of the _expression_ the variable is initialized with:

```typescript
let spam = numToString(42);
```

The return type of `numToString` is `string`, therefore `spam` must also have type `string`.

What about the `result` variable that we initialized to an empty array in `map`? Will the compiler deduce that type?
Here's a comparable example:

```typescript
let result = [];
for (let i = 0; i < 42; ++i) {
  result.push(i);
}
console.log(result);
```

On my installation (TypeScript 10.9.3), the compiler deduces the type of `result` to be `number[]` and allows this:

```
> tsc demo_ts.ts

node demo_ts.js
[ 0, 1, 2 ]
```

Older versions of TypeScript weren't able to deduce this. Progress!

### Inferring return types

Similar to our example that initialized a variable with a _literal_ value (i.e., `let spem = 42;`, `spam` is a number), Typescript will deduce the return type of a function that returns a literal value:

```typescript
function waluigi() {
  return "waluigi time!";
}
```

The compiler infers that `waluigi` is a function that takes in no arguments and returns a `string`.

What would the type inference process look like for the following?
Start with the smallest pieces where we know the type, then put those pieces together until we reach the top.
What would the compiler infer the return type to be?

```typescript
function waluigi_time(num_waluigis: number) {
  if (num_waluigis < 0) {
    return "Where did they go?";
  }
  if (num_waluigis === 0) {
    return null;
  }

  return num_waluigis.toString() + " waluigis!";
}
```

### Inferring generic type variable substitutions

Do we always need to explicitly specify what the generic type parameters should be replaced with?

```typescript
function stringify(nums: number[]): string[] {
  // Can we leave out <number, string> from before?
  return map(nums, numToString);
}

function numToString(num: number): string {
  return num.toString();
}

function map<InputType, OutputType>(
  data: InputType[],
  func: (item: InputType) => OutputType
): OutputType[] {
  let result: OutputType[] = [];
  for (let i = 0; i < data.length; ++i) {
    result.push(func(data[i]));
  }
  return result;
}
```

In this case, the compiler can "infer" or "deduce" what `InputType` and `OutputType` should be.

- In the definition of `map`, the type of `data` is `InputType[]`. Since the type of the `nums` parameter in `stringify` is `number[]`, it infers that `InputType` should be `number`.
- In `map`, the return type of the parameter `func` is `OutputType`. In `stringify`, we pass the function `numToString` to the parameter `func` in `map`. The return type of `numToString` is `string`. Therefore, it infers that `OutputType` should be `string`.

### Inferring function parameter types

Looking at our `numToString` example from earlier, we now know that we can leave out the return type and let the compiler infer it:

```typescript
function numToString(num: number) {
  return num.toString();
}
```

Since `.toString()` returns a string, `numToString` must therefore also return a string.

Can we also leave out the type of the parameter `num`?

```typescript
function numToString(num) {
  return num.toString();
}
```

**By default (non-strict mode)**, the compiler will infer the type of `num` to be `any` because we have **no context** with which to infer a more specific type.
The `any` type essentially **disables type checking** on that value and can **quickly spread** through other inferred types in our program.
This is dangerous!

**In strict mode**, the compiler will report an error because `num` was inferred to have type `any`.

```
> tsc --strict demo_ts.ts

demo_ts.ts:1:22 - error TS7006: Parameter 'num' implicitly has an 'any' type.

1 function numToString(num) {
                       ~~~
```

`any` is not type safe! Do not use it!

### Inferring the type of an arrow function

Arrow functions let us define anonymous (unnamed) functions right when we need them.
We could have instead written `stringify` as:

```typescript
function stringify(nums: number[]): string[] {
  return map(nums, (n) => n.toString());
}

function map<InputType, OutputType>(
  data: InputType[],
  func: (item: InputType) => OutputType
): OutputType[] {
  let result: OutputType[] = [];
  for (let i = 0; i < data.length; ++i) {
    result.push(func(data[i]));
  }
  return result;
}
```

Here, the compiler has access to additional **context** that lets it determine what the type of `n` _should_ be.

Exercise: Walk through the type deduction process to trace how the compiler infers the type of `n` to be `string`.
Start with places where the type is known, and compute the types of larger and larger expressions until you reach the top.

# Inferring types with `Array.map` & `Array.filter`

## `Array.map` and `Array.filter`

Consider this array of distances in miles:

```typescript
const distances = [2.8, 0.500001, 6.74256, 1.3333333];
```

We can use the `map` function we wrote to format these distances as strings with 2 decimal places:

```typescript
console.log(map(distances, (distance) => distance.toFixed(2)));
```

Alternatively, we could use the built-in Array method `.map`:

```typescript
console.log(distances.map((distance) => distance.toFixed(2)));
```

Similarly, we can use the `filter` function we wrote to select only distances less than 3 miles:

```typescript
console.log(filter(distances, (distance) => distance < 3));
```

Or we can use the built-in Array method `.filter`:

```typescript
console.log(distances.filter((distance) => distance < 3));
```

### Combining the two

Since `Array.map` and `Array.filter` both return arrays, we can "chain together" these method calls.
Let's make a first attempt at formatting and filtering these distances in one expression.
Note that whitespace is ignored in TypeScript, so the line breaks between `distances` and `.map` and before `.filter` are just so that we don't have one overly-long line of code.

```typescript
const lessThan3MiFormatted = distances
  .map((distance) => distance.toFixed(2))
  .filter((distance) => distance < 3);
```

```
> tsc

scratch.ts:53:25 - error TS2365: Operator '<' cannot be applied to types 'string' and 'number'.

53   .filter((distance) => distance < 3);
                           ~~~~~~~~~~~~
```

It seems we've made a mistake that the type checker caught!
Even though we're able to leave out type annotations in some places, we still need to be able to reason about what the types are so that we can understand where errors like this are coming from.
This might seem like an easily-fixable example, but the types used in practice can be much more complex.

We need to trace through the parts of our expression and make sure we know what the types are at each step.
In the expression below, state the type at each placeholder in the comments.
If a type can't be determined, state as such.

<!-- prettier-ignore-start -->
```typescript
distances  // ???A - What is the type of `distances` (defined earlier in the notes)?
  // ???B - What is the type of the input parameter `distance`?
  // ???C - What is the return type of the arrow function?
  // ???D - What is the return type of `.map`?
  .map((distance) => distance.toFixed(2))
  // ???E - What is the type of the input parameter `distance`?
  // ???F - What is the return type of the arrow function?
  // ???G - What is the return type of filter?
  .filter((distance) => distance < 3);
```
<!-- prettier-ignore-end -->

Once you've determined what each type should be, where do you see a type mismatch?

#### Solution

- ???A: `distances` is an array of numbers: `number[]`
- ???B: The `distance` parameter expects the same type as the element type of the input array: `number`
- ???C: Looking at the [documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed), `toFixed` returns `string`
- ???D: The output element type is the same as the return type of the function applied to each element. So `.map` here returns `string[]`
- ???E: The `distance` parameter expects the same type as the element of the input array. Since `.map` gave us `string[]`, `distance` must be `string`.
- ???F: The function passed to `.filter` must always return `boolean`.
- ???G: The output element type of `.filter` is the same as the input element type, so `.filter` returns `string[]` here.

Since the input parameter to `.filter`'s arrow function must be a string, we see a type mismatch when we try to use the less-than operator to compare `distance < 3`.

### Fixing the mistake

Let's try reversing the order of our calls to `.map` and `.filter`.
As before, state the type at each placeholder comment.
Do we have any type mismatches?

<!-- prettier-ignore-start -->
```typescript
distances  // ???A - What is the type of `distances` (defined earlier in the notes)?
  // ???B - What is the type of the input parameter `distance`?
  // ???C - What is the return type of the arrow function?
  // ???D - What is the return type of filter?
  .filter((distance) => distance < 3);
  // ???E - What is the type of the input parameter `distance`?
  // ???F - What is the return type of the arrow function?
  // ???G - What is the return type of `.map`?
  .map((distance) => distance.toFixed(2))
```
<!-- prettier-ignore-end -->

#### Solution

- ???A: As before, `distances` is `number[]`
- ???B: The function passed to `.filter` expects a parameter of the same type as the input array: `number`
- ???C: The function passed to `.filter` always returns `boolean`
- ???D: The output element type of `.filter` is the same as the input element type, so `.filter` returns `number[]`
- ???E: The function passed to `.map` expects a parameter of the same type as the input array: `number`
- ???F: Looking at the [documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed), `toFixed` returns `string`
- ???G: The output element type is the same as the return type of the function applied to each element. So `.map` here returns `string[]`

In contrast with our incorrect attempt, the input paramater to the function passed to filter has type `number`, so our less-than comparison works!
