# Iterators & Generators

**Table of Contents**
1. [Iterators & Generators](#iterators--generators)
    1. [A naive implementation of `zip()`](#a-naive-implementation-of-zip)
    1. [Range-based for-loops](#range-based-for-loops)
        1. [Pitfall: `of` vs. `in`](#pitfall-of-vs-in)
        1. [Aside: Expressivity vs. Conciseness](#aside-expressivity-vs-conciseness)
        1. [Aside: Range-based for-loops in C++](#aside-range-based-for-loops-in-c)
    1. [Implementing a ranged-based for-loop with iterators](#implementing-a-ranged-based-for-loop-with-iterators)
        1. [The Iterator Interface](#the-iterator-interface)
        1. [Range-based for-loop: Implementation structure](#range-based-for-loop-implementation-structure)
        1. [Step 1: Implementing a custom iterator class](#step-1-implementing-a-custom-iterator-class)
        1. [Step 2: Adding iterator support to a container class](#step-2-adding-iterator-support-to-a-container-class)
    1. [Implementing `zip()` with iterators](#implementing-zip-with-iterators)
        1. [Custom `ZipIterator` class: Take 1](#custom-zipiterator-class-take-1)
        1. [Custom `ZipIterator` class: Take 2](#custom-zipiterator-class-take-2)
    1. [Making `zip()` more flexible](#making-zip-more-flexible)
    1. [Implementing `zip()` with generators](#implementing-zip-with-generators)
        1. [Generators](#generators)
        1. [Aside: Use the right tool for the job](#aside-use-the-right-tool-for-the-job)
        1. [Final Implementation of `zip`](#final-implementation-of-zip)

## A naive implementation of `zip()`
Consider this function `zip()` that takes in two arrays and returns an array of pairs (arrays of size 2) containing the elements from each array at that index.
```typescript
// Define a *type alias* so that we can just say "Pair" instead of having square brackets everywhere.
type Pair<T, U> = readonly [T, U];
function zip_naive<T, U>(array1: T[], array2: U[]): Pair<T, U>[] {
    const result: Pair<T, U>[] = [];
    for (let i = 0; i < array1.length && i < array2.length; i += 1) {
        result.push([array1[i], array2[i]]);
    }
    return result;
}
console.log(zip_naive([1, 2, 3], [4, 5, 6]));
```
```
> tsc && node main.js

[ [ 1, 4 ], [ 2, 5 ], [ 3, 6 ] ]
```

Where could we run into trouble with this implementation?

Consider what happens if we call `zip` on two very large arrays:
```typescript
const spams = Array(1000000000).fill("spam");
const eggs = Array(1000000000).fill("egg");
for (const pair of zip_naive(spams, eggs)) {
    console.log(pair[0], pair[1]);
}
```
Our implementation creates an entire new array in memory.
If all we need to do is traverse that array once, we've allocated a large amount of memory for no good reason.
This is an example of **egregious inefficiency**: Inefficiency that doesn't have any benefits to it.

In this lesson, we will introduce an elegant way to avoid this problem.

## Range-based for-loops
Consider the code below written in different programming languages. 
Although there are small **syntactic** differences between them, the **semantics** and underlying abstractions they use are very similar.
(Refer back to the "mental models" lecture notes for an example of how the same syntax can have different semantics applied to it).

**Python**
```python
items = ["spam", "egg", "sausage", "spam"]

for item in items:
    print(item)
```

**Java**
```java
List<String> items = new ArrayList<String>(List.of("spam", "egg", "sausage", "spam"));

for (String item : items) {
    System.out.println(item);
}
```

**C++**
```cpp
vector<string> items = {"spam", "egg", "sausage", "spam"};

for (const string& item : items) {
    cout << item << endl;
}
```

**TypeScript**
```typescript
const items = ["spam", "egg", "sausage", "spam"];

for (const item of items) {
    console.log(item);
}
```

These all have the same output:
```
spam
egg
sausage
spam
```

This kind of for-loop is called a **range-based** for-loop.
Rather than traversing with numeric indices (`for (let i = 0; i < items.length; ++i)`), a range-based for loop visits each element once, and we don't have to worry about indexing out-of-bounds.
It's less error-prone and more *expressive*: a win-win!

### Pitfall: `of` vs. `in`
If you're used to programming in Python, you might accidentally write the following JavaScript/TypeScript code:
```typescript
const items = ["spam", "egg", "sausage", "spam"];
// Note use of "in" instead of "of"
for (const item in items) {
    console.log(item);
}
```
```
> tsc --strict main.ts && node main.js
0
1
2
3
```

wat.

In JS/TS, `for (... in ...)` iterates over the **keys of an object**. 
Arrays in JS/TS are Objects where the keys are the *indices* of the array!
`for (... of ...)` iterates over the **values** like we would expect.

### Aside: Expressivity vs. Conciseness
It may be tempting to say that range-based for-loops are better because they are more concise (i.e., fewer characters).
Conciseness is sometimes a usefull shorthand for *expressivity*, but it's important not to conflate the two concepts.
*Expressivity* refers to how easily we can read a piece of code and understand what it *means*.
Trying to write shorter code for its own sake can lead to code like this C code that requires a fairly advanced understanding of C language mechanisms:
```c
void strcpy(const char* from, char* to) {
    /* What in the world does this mean?? (Ask Dr. Perretta in office hours :) ) */
    while (*to++ = *from++);
}
```

### Aside: Range-based for-loops in C++
Ask Dr. Perretta in office-hours about when range-based for-loops were added to C++.

## Implementing a ranged-based for-loop with iterators
We can use the same range-based for-loop syntax to iterate over different types of containers.
This is possible because those container classes all implement an **iterator** interface.
The specifics of iterator interfaces have minor differences from language to language. 
We will focus on iterators in JS/TS. 

### The Iterator Interface
In JS/TS, any object that defines the following interface can be used as an iterator.
These interfaces are built into TypeScript, so you don't need to define them yourself.
We've made a few simplifications below by discarding certain optional parts of the
interfaces.
```typescript
// This definition is built into TypeScript
interface Iterator<ValueType> {
    // A method (a.k.a. "member function") that yields one element and advances the iterator to the next position.
    // The IteratorResult interface is defined below.
    next(): IteratorResult<ValueType>;

    // Note: In JS/TS, the iterator interface technically has two other optional methods,
    // but they are not very commonly used. You can read more in the documentation:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterator_protocol
}

interface IteratorResult<ValueType> {
    // `done` is true when the iterator has reached the end, false otherwise.
    done: boolean;

    // The value of the current iteration.
    // The question mark (`?`) means that the type of `value` is `ValueType | undefined`.
    // In this context, `value` may be undefined when `done` is true. 
    value?: ValueType;
}
```

### Range-based for-loop: Implementation structure
Range-based for loops are implemented using the steps in the pseudocode below:
```typescript
const iterator = container.get_iterator();
let current_result = iterator.next();
while (!current_result.done) {
    assign current_result.value to the loop variable
    current_result = iterator.next();
}
```
First, it acquires an iterator instance from the container class.
Second, it gets the first value from that iterator.
Then, until the iterator is out of values, it assigns the current value to the loop variable (i.e., `spam` in the context `for (let spam of container)`), then gets the next value from the iterator.

### Step 1: Implementing a custom iterator class
As a first step, let's implement an `ArrayIterator` class that iterates over the values of an array.
```typescript
// Similar to in Java, "implements Iterator" tells the type checker to produce an error
// if our class doesn't conform to the interface definition.
class ArrayIterator<ValueType> implements Iterator<ValueType> {
    // Some coding conventions use a leading underscore to distinguish between
    // private vs. public attribute/method names
    // 
    // The `readonly` keyword is like `const`, but for attributes.
    // It promises we won't change what this._array refers to, except
    // when we initialize it in the constructor.
    //
    // The `Readonly<Type>` "utility type" promises we won't change 
    // any attributes of Type. 
    // Here, our ArrayIterator class is promising to:
    // - Not modify any attributes of the array (i.e., not add or remove elements)
    // - Not modify what any elements of the array refer to (i.e., array[3] = 42)
    // - Not modify any attributes of the objects of type ValueType referred to
    //   by the array. 
    private readonly _array: Readonly<Readonly<ValueType>[]>;
    private _index = 0;
    
    constructor(array: ValueType[]) {
        this._array = array;
    }
    
    next(): IteratorResult<ValueType> {
        if (this._index < this._array.length) {
            const current_value = this._array[this._index];
            this._index += 1;
            // Return an object that conforms to the IteratorResult interface.
            return {
                done: false,
                value: current_value,
            };
        }

        // Iteration is finished.
        return {
            done: true,
            value: undefined,
        };        
    }
}
```

We can now use this iterator to traverse arrays.
```typescript
const items = ["spam", "egg", "sausage", "spam"];

const iterator = new ArrayIterator(items);
let current_result = iterator.next();
while (!current_result.done) {
    console.log(current_result.value);
    current_result = iterator.next();
}
```

### Step 2: Adding iterator support to a container class
In our pseudocode from before, we've implemented every part of a range-based for-loop except for the initial step of getting an iterator from a container class.
```typescript
const iterator = container.get_iterator();  // How do we implement this part?
let current_result = iterator.next();
while (!current_result.done) {
    assign current_result.value to the loop variable
    current_result = iterator.next();
}
```

We need to specify another **interface** that lets our range-based for-loop request an iterator from an object without knowing anything else about that object.
We will call this interface `Iterable`.
In our pseudocode, we used the name `get_iterator` as a placeholder for the name of a method in the `Iterable` interface that returns an `Iterator` object.

Different languages use different names for this method.
In python, this method would be called `__iter__`.
In JS/TS, the syntax is a bit strange:
```typescript
interface Iterable<ValueType> {
    [Symbol.iterator](): Iterator<ValueType>;
}
```
Why are there square brackets there?? 
The answer to that question is beyond the scope of this course.
You can think of it as: The `Iterable` interface requires a special method called `[Symbol.iterator]` (including the square brackets!) that returns an iterator associated with the object to be iterated over.

The `Array` class in JS/TS implements the `Iterable` interface.
Since the built-in `Array` class has a lot of methods, let's just look at a simple array wrapper class together with our `ArrayIterator` class from before to show how this works.
```typescript
class DemoArray<ItemType> {
    private _data: ItemType[];

    constructor(data: ItemType[]) {
        this._data = data;
    }

    [Symbol.iterator](): Iterator<ItemType> {
        return new ArrayIterator(this._data);
    }
}
```

We can use this custom class with a range-based for-loop!
```typescript
const array = new DemoArray(["spem", "egg", "sausage", "spam"]);
for (const item of array) {
    console.log(item);
}
```
```
> tsc && node main.js

spam
egg
sausage
spam
```

## Implementing `zip()` with iterators
Recall that our [first implementation of `zip`](#a-naive-implementation-of-zip) creates an array with the full sequence of pairs **all at once**.
Iterators give us the option to produce **one element at a time**.
```typescript 
const array = ["spam", "egg", "sausage", "spam"];
// Yes, this syntax is bizarre. 
// Think of it as equivalent to saying `array.get_iterator()` 
const iter = array[Symbol.iterator]();
let result1 = iter.next();
console.log(result1.value);
// iter has advanced to the position of the second element
```
```
> tsc && node main.js

spam
```

### Custom `ZipIterator` class: Take 1
We can now write a custom iterator class that yields a single pair each time `next` is called.
```typescript
class ZipIterator<T, U> implements Iterator<Pair<T, U>> {
    readonly _iter1: Iterator<T>;
    readonly _iter2: Iterator<U>;

    constructor(iter1: Iterator<T>, iter2: Iterator<U>) {
        this._iter1 = iter1;
        this._iter2 = iter2;
    }

    next(): IteratorResult<Pair<T, U>> {
        const result1 = this._iter1.next();
        const result2 = this._iter2.next();

        if (result1.done || result2.done) {
            return {
                done: true,
                value: undefined,
            }
        }

        return {
            value: [result1.value, result2.value],
            done: false,
        };
    }
}
```

With this custom iterator, let's try writing another version of our `zip` function that takes in two arrays and returns a `ZipIterator`.
```typescript
function zip_iter1<T, U>(array1: T[], array2: U[]): ZipIterator<T, U> {
    return new ZipIterator(array1[Symbol.iterator](), array2[Symbol.iterator]());
}

for (const pair of zip_iter1([1, 2, 3], [4, 5, 6])) {
    console.log(pair);
}
```
```
> tsc && node main.js

main.ts:136:24 - error TS2488: Type 'ZipIterator<number, number>' must have a '[Symbol.iterator]()' method that returns an iterator.

136     for (const pair of zip_iter1([1, 2, 3], [4, 5, 6])) {
                           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

Why does the TypeScript compiler report this error? 
Think about the required interface for a type to be used in a range-based for-loop.

### Custom `ZipIterator` class: Take 2
Thinking back to our example of a simple container class that can be traversed with a range-based for-loop, we had to do two things:
1. Implement a [custom iterator class](#step-1-implementing-a-custom-iterator-class)
2. [Override the `[Symbol.iterator]` method on the **container** class](#step-2-adding-iterator-support-to-a-container-class), thereby implementing the `Iterable` interface.

So does this mean we need to write yet another custom class that stores both arrays as member variables and overrides the `[Symbol.iterator]` method to return an instance of `ZipIterator`?
We could do this, but let's do something a bit more streamlined. 
Let's update `ZipIterator` so that it implements `Iterator` *and* `Iterable`!
```typescript
// Note the addition of Iterable<Pair<T, U>>
class ZipIterator<T, U> implements Iterator<Pair<T, U>>, Iterable<Pair<T, U>> {
    // Attributes and constructor same as before

    next(): IteratorResult<Pair<T, U>> {
        // Same as before
    }

    // Since ZipIterator is already an Iterator, we don't have to do
    // anything to it! We can just return itself!
    [Symbol.iterator]() {
        return this;
    }
}

for (const pair of zip_iter1([1, 2, 3], [4, 5, 6])) {
    console.log(pair);
}
```
```
> tsc && node main.js

[ 1, 4 ]
[ 2, 5 ]
[ 3, 6 ]
```

## Making `zip()` more flexible
At this point, the usage of our `zip` function is fairly convenient.
We can call it and use a range-based for-loop to traverse the results, or we can store the iterator for later use without worrying about computational overhead before we need it.

However, we are limited to only being able to pass arrays as parameters. 
To make `zip()` more flexible, let's update its signature to take in two **iterators** instead.
```typescript
function zip<T, U>(first: Iterable<T>, second: Iterable<U>) {
    // We'll talk about the implementation soon.
}
```

What should the return type be?
Do we need to also update `ZipIterator` to take in two `Iterable`s?
This feels a bit redundant, and it's somewhat clunky to have to:
* declare an entire class with attributes and a constructor
* explicitly return `IteratorResult` objects indicating whether iteration has finished or not
Fortunately, there is a modern language mechanism that lets us write a more expressive implementation of `zip`.

## Implementing `zip()` with generators

### Generators
Consider the following class `CountdownIterator`.
```typescript
// `implements IterableIterator<number>` is the same as
//  `implements Iterable<number>, Iterator<number>`
class CountdownIterator implements IterableIterator<number> {
    private _count: number;

    constructor(count: number) {
        this._count = count;
    }

    next(): IteratorResult<number> { 
        if (this._count < 0) {
            return {
                done: true,
                value: undefined,
            };
        }

        let to_yield = this._count;
        this._count -= 1;
        return {
            done: false,
            value: to_yield,
        };
    }

    [Symbol.iterator]() {
        return this;
    }
}
```
If I didn't know that this class were called `CountdownIterator`, I would have to piece together how the different parts of the implementation of `next` work together across multiple calls to `next`.
In other words, this functionality is implemented in a *functional* paradigm, but I could more quickly understand its meaning if it were written in an *imperative* paradigm (i.e., using a loop).

Here's how we do that in JS/TS.
```typescript
function* countdown(count: number) {
    while (count >= 0) {
        yield count;
        count -= 1;
    }
}
```
Let's break down the new pieces of syntax:
1. Instead of `function` we have `function*`. This tells us that the function returns a **generator**. A generator is an object that implements the `IterableIterator` interface.
2. The `yield` keyword is analogous to returning an `IteratorResult` object from next. `yield` takes the value and automatically constructs an `IteratorResult` object to return. 
Let's see it in action:
```typescript
let final = countdown(10);  // It's the final countdown ;)
// final has the methods of the Iterator interface, so we can call .next() on it
let iter_result = final.next();
console.log(iter_result.value, iter_result.done);
```

We can also traverse generator objects with a range-based for-loop because generators have the methods of the `Iterable` interface.
```typescript
for (let i of countdown(3)) {
    console.log(i);
}
```
```
> tsc && node out/main.js

3
2
1
0
``` 

#### Aside: Use the right tool for the job
Some problems can be expressed more clearly in a functional paradigm, some can be expressed more clearly in an imperative paradigm, and some can be expressed more clearly in an object-oriented paradigm. 
These paradigms can also be combined. 
Python, JavaScript, and even C++ are considered multi-paradigm languages. 
Part of being a good programmer is knowing **when to use which combination of paradigms**.
People get into fights on the internet about which paradigm is "better," which I believe is unproductive.
Programming is about understanding tradeoffs and knowing which tools to use when.

### Final Implementation of `zip`
Now we can streamline our `zip` implementation using generators. 
The full solution is below, but try implementing on your own it as an exercise first.
Use the following starter code:
```typescript
// NOTE: One thing is missing from the function signature. 
// Add it to your implementation.
function zip<T, U>(first: Iterable<T>, second: Iterable<U>): Generator<Pair<T, U>> {
    let iter1 = first[Symbol.iterator]();
    let iter2 = second[Symbol.iterator]();

    // Add the rest of the implementation
}

// A basic example test case
const spams = Array(4).fill("spam");
const eggs = Array(4).fill("egg");
for (const pair of zip(spams, eggs)) {
    console.log(pair);
}
```

To help you try to implement `zip` on your own before looking at the solution, here is the `ZipIterator` class again from before.
Try to convert its structure to one that uses a `while` loop.
```typescript
class ZipIterator<T, U> implements Iterator<Pair<T, U>> {
    readonly _iter1: Iterator<T>;
    readonly _iter2: Iterator<U>;

    constructor(iter1: Iterator<T>, iter2: Iterator<U>) {
        this._iter1 = iter1;
        this._iter2 = iter2;
    }

    next(): IteratorResult<Pair<T, U>> {
        const result1 = this._iter1.next();
        const result2 = this._iter2.next();

        if (result1.done || result2.done) {
            return {
                done: true,
                value: undefined,
            }
        }

        return {
            value: [result1.value, result2.value],
            done: false,
        };
    }
}
```

The solution for `zip` using generators is below.

.

..

...

....

.....

.....

.....

.....

.....

.....

.....

.....

.....

.....

.....

.....

.....

..... (keep scrolling)

.....

.....

.....

.....

.....

.....

.....

SOLUTION
```typescript
function* zip<T, U>(first: Iterable<T>, second: Iterable<U>): Generator<Pair<T, U>> {
    let iter1 = first[Symbol.iterator]();
    let iter2 = second[Symbol.iterator]();

    let result1 = iter1.next();
    let result2 = iter2.next();

    while (!result1.done && !result2.done) {
        yield [result1.value, result2.value];

        result1 = iter1.next();
        result2 = iter2.next();
    }
}
```
