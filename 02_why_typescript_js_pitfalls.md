# JavaScript, TypeScript, and You

This lesson discusses some motivation for using TypeScript instead of plain JavaScript and introduces some important things to know about TypeScript's type system and certain pitfalls of JavaScript.

**Table of Contents**
1. [JavaScript, TypeScript, and You](#javascript-typescript-and-you)
1. [Why TypeScript over plain JavaScript?](#why-typescript-over-plain-javascript)
    1. [JavaScript standards versus implementation](#javascript-standards-versus-implementation)
    1. [TypeScript's type system](#typescripts-type-system)
1. [Useful things & pitfalls to know about in TypeScript](#useful-things--pitfalls-to-know-about-in-typescript)
    1. [`null` and union types](#null-and-union-types)
    1. [`undefined` vs `null`](#undefined-vs-null)
        1. [Pitfall: Indexing out of bounds in an array](#pitfall-indexing-out-of-bounds-in-an-array)

# Why TypeScript over plain JavaScript?

## JavaScript standards versus implementation

Theoretically, JavaScript implements the ECMAScript standard.
In practice, different browsers and runtime environments have adopted newer language features at a different pace.
There was a time when even seemingly basic things like classes that behave the way that we would expect in a typical object-oriented language were supported by some browsers but not others.

One of the things that the TypeScript compiler does for us is make a uniform set of language features available.
Similar to a C++ compiler that produces assembly code that runs on different CPUs, the TypeScript compiler produces JavaScript that runs in different JavaScript environments.

## TypeScript's type system

The static type system that TypeScript adds is probably one of its most powerful features.
Having a type checker be able to catch certain kinds of errors is especially helpful because of the number of potential mistakes caused by "surprising" JavaScript behaviors.

Consider this JavaScript code.
What would you expect the output to be based on your experience in Python or Java?

```javascript
class Thing {
  constructor() {
    this.spam = 42;
    this.egg = 43;
  }
}

let thing = new Thing();
console.log(thing.waluigi);
```

In Java the compiler raise an error saying that `Thing` has no member `waluigi`.
In Python, we would get an `AttributeError` at runtime.

In JavaScript...we get `undefined`.

In the realm of web programming, this can be very confusing!
HTML would display that `undefined` value as blank, which could make it difficult to trace where exactly the issue is coming from as the code gets more complex.

It's not until we try perform certain operations on `undefined` that we get an error:

```javascript
class Thing {
  constructor() {
    this.spam = 42;
    this.egg = 43;
  }
}

let thing = new Thing();
console.log(thing.waluigi.time);
```

Output from Node:

```
console.log(thing.waluigi.time);
                          ^

TypeError: Cannot read properties of undefined (reading 'time')
    at file:///home/jperretta/cs220/lecture/lec2/test.js:9:27
    at ModuleJob.run (node:internal/modules/esm/module_job:345:25)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:651:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:117:5)

Node.js v22.19.0
```

To add to the confusion, what if we did this instead?

```javascript
class Thing {
  constructor() {
    this.spam = 42;
    this.egg = 43;
  }
}

let thing = new Thing();
console.log(thing.waluigi + 1);
```

Output:

```
NaN
```

[wat](https://www.destroyallsoftware.com/talks/wat)

In Typescript, the compiler gives us much more helpful information without even running the program:

```typescript
class Thing {
  spam: number;
  egg: number;
  constructor() {
    this.spam = 42;
    this.egg = 43;
  }
}

let thing = new Thing();
console.log(thing.waluigi + 1);
```

```
> tsc --noEmit test.ts

test.ts:11:19 - error TS2339: Property 'waluigi' does not exist on type 'Thing'.

11 console.log(thing.waluigi + 1);
                     ~~~~~~~


Found 1 error in test.ts:11
```

# Useful things & pitfalls to know about in TypeScript

## `null` and union types

In Java (and many other widely-used languages), reference types can implicitly be null.

```java
// Nothing in the type signature indicates that this might be null!
String spam = null;
```

Later in the program, if `spam` is `null` and we try to call a method on it, we'll get a `NullPointerException` at runtime.

```java
if (spam.equals("waluigi")) {
    System.out.println("Waluigi time!");
}
```

Tony Hoare, the creator of the ALGOL W language in 1965 called this the ["Billion Dollar Mistake"](https://www.infoq.com/presentations/Null-References-The-Billion-Dollar-Mistake-Tony-Hoare/)

In Typescript, we can turn on "strict null checks" to catch these potential mistakes.

```typescript
spam: string = null;
```

```
> tsc --strict demo_ts.ts

demo_ts.ts:1:5 - error TS2322: Type 'null' is not assignable to type 'string'.

1 let spam: string = null;
      ~~~~
```

We can explicitly declare null as being part of the type using a "union type".
The pipe operator `|` declares a union type, which means that the value could be of the type on either side of the pipe.

```typescript
spam: string | null = null;
```

Then, if we try to perform a string-specific operation, the compiler will catch it before we run the program.

```typescript
spam: string | null = null;

if (spam.length > 0) {
    console.log(string);
}
```

```
> tsc demo_ts.ts --strict demo_ts.ts

demo_ts.ts:1:5 - error TS2322: Type 'null' is not assignable to type 'string'.

1 let spam: string = null;
      ~~~~
```

We can fix the error by checking whether the value is `null` first:

```typescript
spam: string | null = null;

if (spam === null) {
    console.log("Value is null");
}
else if (spam.length > 0) {
    console.log(string);
}

// or

if (spam !== null && spam.length > 0) {
    console.log(string);
}
```

The compiler can figure out that we only access `spam.length` if `spam` is not null.
It "narrows" the type from `string | null` to `string`.

## `undefined` vs `null`

Javascript is unusual in that it has more than one way to represent the idea of a "null" value.
Earlier we saw that in JavaScript, accessing a member that does not exist on an object returns `undefined`.
It's also the value given to a variable that is uninitialized.
In other words, `undefined` plays a role in certain "built-in" parts of the language.
`null` only really shows up if programmers/library authors use it explicitly.

We could rewrite our `string | null` Example from earlier to use undefined instead of null:

```typescript
spam: string | undefined = undefined;

if (spam === undefined) {
    console.log("Value is undefined");
}
else if (spam.length > 0) {
    console.log(string);
}
```

This code behaves exactly like the version that used `null`.
So which one should we use?
Programmers disagree on this.
The "right" choice depends on the style conventions of a software project and whether any of the subtle differences between what `null` and `undefined` do have an impact on the code being written.

Feel free to ask me about this debate in office hours. :)

### Pitfall: Indexing out of bounds in an array

In Javascript indexing out of bounds in an array returns `undefined`.
However Typescript does not infer `undefined` to be part of the type when indexing in an array.

```typescript
let values: number[] = [1, 2, 3];
let spam: number = values[5];
console.log(spam);
```

```
> tsc demo_ts.ts

> node demo_ts.js
undefined
```

Yikes! This behavior is somewhat of a practical decision.
Since the length of arrays often changes, it turns out that it is extremely difficult (computationally "undecidable") to know whether an index is in-bounds without running the program.
Instead of requiring the programmer to add a check every time they access an element in an array (which would have a HUGE negative performance impact), TypeScript leaves it up to the programmer to add those checks when they're needed.
