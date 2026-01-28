Map & Filter
============
*Lecture notes by James Perretta, revised Jan. 28, 2026*

**Table of Contents**
1. [Learning Objectives](#learning-objectives)
1. [Duplicated & Unexpressive Code](#duplicated--unexpressive-code)
    1. [Repeated patterns](#repeated-patterns)
    1. [Understandability](#understandability)
1. [Refactoring the Code](#refactoring-the-code)
    1. [Filling in the ???: First-class functions](#filling-in-the--first-class-functions)
    1. [A type-annotation for the function passed to `map`](#a-type-annotation-for-the-function-passed-to-map)
1. [Making `map` more flexible](#making-map-more-flexible)
1. [Arrow Functions: How to avoid having to write silly one-line one-off functions.](#arrow-functions-how-to-avoid-having-to-write-silly-one-line-one-off-functions)
1. [Filter](#filter)
    1. [Exercise: Refactoring to use `filter`](#exercise-refactoring-to-use-filter)
        1. [Solution](#solution)
1. [TypeScript/JavaScript Build-In Array `map` and `filter`](#typescriptjavascript-build-in-array-map-and-filter)
1. [Programming Practices: Copying the array vs. modifying in place](#programming-practices-copying-the-array-vs-modifying-in-place)

# Learning Objectives
* Practice recognizing duplicated code
* Practice coming up with more expressive abstractions that reduce duplication and improve understandability
* Learn how to write functions that take in other functions as arguments
    * Learn how this gives us more ways to write expressive abstractions and reduce duplication
* Apply these concepts in the context of generic `map` and `filter` functions

# Duplicated & Unexpressive Code
For our first example, suppose we have an array of distances in miles to some local restaurants.
The code below performs some computations with those distances and prints the results with a bit of formatting.
As you read the code, think about:
* What repeated patterns in the code do you see?
* Which parts of the code help the reader understand what it is doing?
* Which parts of the code distract the reader from understanding what it is doing?
```typescript
const restaurantDistances = [2.2, 6.2, 7, 5.1];

const distancesInMiAsStrs: string[] = [];
for (const mi of restaurantDistances) {
    distancesInMiAsStrs.push(mi.toFixed(2)); // format with 2 decimal places
}

console.log("Distances in MI:");
console.log(distancesInMiAsStrs.join("\n")); // newline between each distance

const distancesInKm: number[] = [];
for (const miles of restaurantDistances) {
    distancesInKm.push(miles * 1.6);
}

const distancesInKmAsStrs: string[] = [];
for (const km of distancesInKm) {
    distancesInKmAsStrs.push(km.toFixed(2));
}

console.log("Distances in KM:");
console.log(distancesInKmAsStrs.join("\n"));

const walkingTimes: number[] = [];
for (const miles of restaurantDistances) {
    walkingTimes.push(miles / 3); // for simplicity assume walking speed of 3MPH
}

const walkingTimesRoundedUp = [];
for (const time of walkingTimes) {
    walkingTimesRoundedUp.push(Math.ceil(time)); // round up to the nearest minute
}

console.log("Walking Times in Minutes:")
console.log(walkingTimesRoundedUp.join("\n"));
```

We discuss the above questions below.

## Repeated patterns
In 5 places, this code takes an array, loops through it, and populates a new array.
Each element of the old array is processed in some way to produce a new value.
The order of the elements is unmodified.
The **only differences** between these 5 loops are:
* The input and output arrays used
* The expression passed to `.push()`

While using a range-based for-loop (i.e., `for (const item of array) { ... }`) is often a good choice, we should try to use an abstraction that reduces code duplication and more expressively communicates the code's meaning.

## Understandability 
**Variable names:** Well-chosen variable names such as `walkingTimes` or `distancesInKm` help the reader understand the intent of each loop.
However, the reader still has to double check that the code does what it is intended to.

**What about walkingTimesAsStrs?** I would describe this as "clunky". On the one hand, the variable name tells us exactly what it is. On the other hand, this value seems to be purely intermediate. That is, the intent of the code is to print the walking times rounded up, but we don't (yet) have a way to combine the rounding-up and printing steps.

**Comments**: There is some nuance to whether a comment is helpful or distracting. In the code above, I've included more comments than I typically would because this course does not assume prior TypeScript experience. In my own development work, I would leave out the comments explaining `.toFixed()`, `Math.ceil()`, and `.join()`. I would leave a comment explaining why we are using a hard-coded `3` to represent the walking speed (and I would likely need to eventually refactor away this "magic number").

# Refactoring the Code
Consider this snippet of the duplicated, unexpressive code from before:
```typescript
const walkingTimes: number[] = [];
for (const miles of restaurantDistances) {
    walkingTimes.push(miles / 3); // for simplicity assume walking speed of 3MPH
}

const walkingTimesRoundedUp: number[] = [];
for (const time of walkingTimes) {
    walkingTimesRoundedUp.push(Math.ceil(time)); // round up to the nearest minute
}
```

We've identified the similarities between these loops.
Now let's work on writing a function that is general enough that we can replace each instance of duplication with a call to the new function.

Following prior conventions, we'll call this function `map`, as in "a one-to-one mapping between the values in the input and output arrays".
If it helps to think of it by another name, the C++ standard library equivalent of `map` is called `transform`.

We can start with the input and output arrays:
```typescript
// Takes in an array of numbers and returns a new array of numbers
function map(input: number[], ???): number[] {
    const result = [];
    for (const item of input) {
        result.push(???);
    }
    return result;
}
```
Using this function to refactor our snippet, we have:
```typescript
const walkingTimes = map(restaurantDistances, ???);
const walkingTimesRoundedUp = map(walkingTimes, ???);
```
This is already an improvement.
In each statement, the first thing the reader sees is the variable name expressing intent, and the second thing the reader sees is that we're calling `map`, which will immediately communicate how the implementation meets the intent.
Assuming `map` has been thoroughly tested, we can also have confidence that it correctly does what we need it to.

## Filling in the ???: First-class functions
Recall that in our duplicated code, the other difference across the instances of the same pattern was the *expression* passed to `.push()`.
So what we need is a way to pass **code that can be run later** as an argument to a function.

The code-that-can-be-run-later can be created with **another function**.
In TypeScript, functions are **first-class**.
This means that they can be:
* Created at runtime
* Passed as arguments to other functions
* Returned from other functions
* Referenced by variables (more on this in future lessons)

Knowing this, we can update our implementation of `map` to take in a function and call that function on each element of the array:
```typescript
function map(input: number[], func): number[] { // We'll add a type annotation for func naxt
    const result = [];
    for (const item of input) {
        result.push(func(item));
    }
    return result;
}
```
We use the term "Higher-Order Function (HOF)" to refer to functions that take in other functions as arguments.

Next, let's update the first call to map in our refactored code from before.
First, we need a function that we can pass to map.
Let's define `walkingTime` to take in a distance in miles and return a number of minutes, then pass that function to `map`.
```typescript
function walkingTime(miles: number): number {
    return miles / 3;
}

const walkingTimes = map(restaurantDistances, walkingTime);
const walkingTimesRoundedUp = map(walkingTimes, ???);
```

To refactor the second line, we don't need to define a new function.
`Math.ceil` already does what we need it to!
```typescript
function walkingTime(miles: number): number {
    return miles / 3;
}

const walkingTimes = map(restaurantDistances, walkingTime);
const walkingTimesRoundedUp = map(walkingTimes, Math.ceil);
```

## A type-annotation for the function passed to `map`
We want the type checker to enforce that the function we pass to `map` is compatible with our input and output types.
The syntax for this is:
```typescript
function map(input: number[], func: (value: number) => number): number[] { ... }
```
`value` is a function that takes in a number and returns a number.
We can sometimes improve readability by using a **type alias**, which lets us refer to the type by a different name, similar to how we'd use a variable name:
```typescript
type MapFuncType = (value: number) => number;
function map(input: number[], func: MapFuncType): number[] { ... }
```

# Making `map` more flexible
Our current version of `map` only works when our input and output are arrays of numbers.
Consider this snippet from our duplicated code.
What are the types of the input and output arrays?
```typescript
const distancesInKmAsStrs = [];
for (const km of distancesInKm) {
    distancesInKmAsStrs.push(km.toFixed(2));
}
```
Since `.toFixed` returns a string, we need `map` to be able to take in an array of numbers and return an array of strings.

We can accomplish this by making the parameter and return types **generic**.
Consider our current number-only function signature for `map` again.
Which parameter and return types correspond to each other?
That is, of the four times `number` appears in the type signature, which of those have to match, and which can be different?
```typescript
function map(input: number[], func: (value: number) => number): number[] { ... }
```

Since each element of the `input` array is passed to `func` as an argument, that means the type of the elements in `input` has to be compatible with the type of the `value` parameter that `func` expects.
The values returned by `func` are then added to the result array, so that means the return type of `func` must be compatible with the type of the elements in the array returned from `map`.

This tells us that we need **2 generic type parameters**: one for the input array elements & the parameter that `func` takes in, and one for the values `func` returns and the returned array elements.
We can write this code as follows:
```typescript
function map<InputType, OutputType>(input: InputType[], func: (value: InputType) => OutputType): OutputType[] {
    const result = [];
    for (const item of input) {
        result.push(func(item));
    }
    return result;
}
```

If we want to use a type alias for `func` to improve the readability, we can specify the same generic type parameters for the type alias:
```typescript
type MapFuncType<InputType, OutputType> = (value: InputType) => OutputType;
function map<InputType, OutputType>(input: InputType[], func: MapFuncType<InputType, OutputType>): OutputType[] { ... }
```

With this updated version of `map`, we can rewrite the loop from before.
Note that we've also added a function `twoDecimalPlaces` that calls `.toFixed` on a number.
```typescript
function twoDecimalPlaces(num: number): string {
    return num.toFixed(2);
}

const distancesInKmAsStrs = map(distancesInKm, twoDecimalPlaces);
```

Note that the **name** of the parameter of the function passed to `func` does not have to match--only the type has to be compatible.

# Arrow Functions: How to avoid having to write silly one-line one-off functions.
We've seen one instance where we were able to pass a pre-existing function (`Math.ceil`) directly to `map`.
We've also seen some instances where we had to write questionably-specific functions because the expression we wanted to apply to each array element wasn't aleady in the form of a function.
The most egregious example of this is our `twoDecimalPlaces` function:
```typescript
function twoDecimalPlaces(num: number): string {
    return num.toFixed(2);
}
```
This function does not make our code easier to understand.
The expression `num.toFixed(2)` already communicates its meaning very effectively. 

We need a way to write "throwaway" functions that are only used once and only meaningful in the context of being passed to `map`.
Many programming languages provide a way to do this, often referring to them as "lambda functions" or "anonymous functions". 
In TypeScript, they are referred to as "arrow functions".
Let's replace `twoDecimalPlaces` with an arrow function.
```typescript
const distancesInKmAsStrs = map(distancesInKm, (num: number) => num.toFixed(2));
```
Although this syntax looks similar to the syntax for the **type** of a function, notice that on the right-hand-side of the arrow:
* an arrow function takes an **expression** that evaluates to a value.
  ```typescript
  (num: number) => num.toFixed(2)  // expression to the right of the arrow
  ```
* the declared type of a function takes a **type** specifiyng what the function returns
  ```typescript
  (value: number) => string  // type to the right of the arrow
  ```

Arrow functions have multiple syntactic forms. We discuss these below.

**Form 1: No curly braces**
If the body of the arrow function is a single expression, we can write by itself with no curly braces and without the `return` keyword.
```typescript
(num: number) => num.toFixed(2)
```

**Form 2: With curly braces & return**
If the body of the arrow function is to complex for a single expression, we can write a **block** (denoted by curly braces) of multiple statements, just like how we would typically write the body of a function.  
**IMPORTANT**: You must explicitly return a value with the `return` keyword!
```typescript
(num: number) => {
    const intermediateValue = someComplicatedExpression(num);
    return intermediateValue.toFixed(2);  // Remember to return a value!
}
```

**Form 3: Sometimes you can leave out the parameter types and parentheses**
If the type of the parameter(s) passed to the arrow function can be deduced from context, it's sometimes possible to omit the parameter types.
We'll discuss deducing types in a future lesson.
```typescript
map(distancesInKm, (num) => num.toFixed(2))
```
when the arrow function only takes one parameter and we are able to omit the type of that parameter, we can also omit the parentheses:
```typescript
map(distancesInKm, num => num.toFixed(2))
```

# Filter
Another common pattern for which we can build an abstraction using higher-order functions is `filter`, where we take in an array of elements and produce a new array containing only elements for which some condition is true.
Consider the following functions that use this pattern.
As you read the code, think about:
* What the high-level structure of the implementation is (i.e., what are the common steps?)
* Which part(s) can be abstracted away as the input and returned output array?
* Which part(s) require a higher order function to abstract away? That is, what is the "different" part?
* What do the input and output types of the function passed in as a parameter have to be?
* What should the generic type parameters be? I.e., are the types of the elements of the input & output arrays the same or different? Do those need to match the input or output type of the function passed in as a parameter?
```typescript
function filterNonEmpty(strs: string[]): string[] {
    const result: string[] = [];
    for (const item of strs) {
        if (item.length !== 0) {
            result.push(item);
        }
    }
    return result;
}

function filterLen10OrLess(strs: string[]): string[] {
    const result: string[] = [];
    for (const item of strs) {
        if (item.length <= 10) {
            result.push(item);
        }
    }
    return result;
}

function filterEven(nums: number[]) {
    const result: number[] = [];
    for (const item of nums) {
        if (item % 2 === 0) {
            result.push(item);
        }
    }
    return result;
}

console.log(filterNonEmpty(["spam", "", "", "spam"]));
console.log(filterLen10OrLess(["spaaaaaaaaaaaaaam", "spaaam", "spam"]));
console.log(filterEven([42, 43, 37, 11]));
```

Following the steps from before, we can start with a skeleton for our `filter` function.
As you read the skeleton, think about what the `???X` placeholders should be replaced with.
```typescript
type ConditionFuncType = (value: ???A) => ???B;

function filter(array: ???C[], conditionFunc: ConditionFuncType): ???D[] {
    const result: ???E[] = [];
    for (const item of array) {
        if (conditionFunc(item)) {
            result.push(item);
        }
    }
    return result;
}
```

Let's start with `???B`, the return type of the condition function. 
Since the return value of `conditionFunc` is passed to our `if` statement, `???B` must be `boolean`.

Next, which of `???A`, `???C`, `???D`, and `???E` are the same?
* Since we push the original array elements into the `result` array, that means `???C` and `???E` must be the same.
* Since the result array is what we return, `???E` and `???D` must also be the same.
* Since we pass the array elements directly into `conditionFunc`, `???C` and `???A` must also be the same.
* By the transitive property, all four of these placeholders are the same type.

Since `conditionFunction` always returns `boolean` and the other four placeholders are the same, this tells us we need only one generic type variable.
Filling in these pieces, we have our full implementation of `filter`:
```typescript
type ConditionFuncType<ElementType> = (value: ElementType) => boolean;

function filter<ElementType>(array: ElementType[], conditionFunc: ConditionFuncType<ElementType>): ElementType[] {
    const result: ElementType[] = [];
    for (const item of array) {
        if (conditionFunc(item)) {
            result.push(item);
        }
    }
    return result;
}
```

## Exercise: Refactoring to use `filter`
Replace the 3 filterX function calls below with calls to `filter`.
```typescript
console.log(filterNonEmpty(["spam", "", "", "spam"]));
console.log(filterLen10OrLess(["spaaaaaaaaaaaaaam", "spaaam", "spam"]));
console.log(filterEven([42, 43, 37, 11]));
```

### Solution
```typescript
console.log(filter(["spam", "", "", "spam"], str => str.length !== 0));
console.log(filter(["spaaaaaaaaaaaaaam", "spaaam", "spam"], str => str.length <= 10));
console.log(filter([42, 43, 37, 11], num => num % 2 === 0));
```

# TypeScript/JavaScript Build-In Array `map` and `filter`
JavaScript's build-in Array type has `map` and `filter` methods. 
As an exercise, read through the MDN documentation on [`map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
and [`filter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) and convert the code examples from this lesson to use those methods instead of our custom `map` and `filter` functions.

# Programming Practices: Copying the array vs. modifying in place
There is a tradeoff between making a copy of the array vs. modifying it in place.
On the one hand, making many copies of large arrays could make our code run slower.
On the other hand, it quickly becomes difficult to keep track of where and how arrays or other objects have been modified if passing an array or object to a function means that it could potentially change. 
Consider the following:
```typescript
const myArray = ["spam", "egg", "sausage"];
const result = someFunction(myArray);  // No syntactic indication whether `someFunction` modifies `myArray`
```
There is a saying that "premature optimization is the root of all evil".
As programmers, we should strive first to right code that is expressive and easy to understand.
If we run into performance issues, we should then collect data about where the slow parts of our program are and strategically optimize them.

Something that will be covered in a future lesson is that JS/TS uses **references** for variables, array elements, and object fields, which helps us avoid situations where we are making copies of large objects.
