# Closures

This lesson introduces the concept of a **closure** (loosely, a function returned from another function).
We show how closures interact with **lexical scope** and variable **lifetimes** and present several kinds of program behavior we can achieve using them.

**Table of Contents**
1. [Closures](#closures)
1. [Lexical Scope & Lifetime](#lexical-scope--lifetime)
    1. [Lifetime of a Local Variable](#lifetime-of-a-local-variable)
        1. [Extra: Ask Dr. Perretta in Office Hours](#extra-ask-dr-perretta-in-office-hours)
    1. [Extending the Lifetime](#extending-the-lifetime)
1. [Ways we can use Closures](#ways-we-can-use-closures)
    1. [Store read-only state](#store-read-only-state)
        1. [Motivating Use Case: Form Field Validation](#motivating-use-case-form-field-validation)
        1. [Solution: A function that creates "validate" functions](#solution-a-function-that-creates-validate-functions)
    1. [Store and update state](#store-and-update-state)
        1. [Closures + Higher-Order Functions](#closures--higher-order-functions)
    1. ["Wrap" functions to add behavior to them](#wrap-functions-to-add-behavior-to-them)

# Lexical Scope & Lifetime
TypeScript is a *lexically-scoped* language.
This means that the **lifetime** of a **name** is determined by which **scope** it is declared in.
```typescript
let spam = 42;  // global scope

// function "egg" is declared in the global scope
function egg(param: number) {  // parameters are local variables in the function's local scope
    let waluigi = "waaaa";  // local scope inside the function
    if (param === 42) {
        let time = 6;  // local scope inside the if statement
        console.log(spam);  // we can access outer-scope names from an inner scope
    }
    else {
        console.log(waluigi);  // we can access outer-scope names from an inner scope
    }
    console.log(zap());  // zap is declared in the global scope, so we can access it here
    // (the full answer is a little more subtle, ask Dr. Perretta about it in office hours :) ) 
}

function zap() {
    console.log("zap!");
}
```
We can access names in our inner-most scope and in our parent scope. 
For example, in the above code, we can access `spam` in the nested scope of the if statement even though `spam` was declared in the global scope.

## Lifetime of a Local Variable
What is the output of this code?
```typescript
let spam = random_int();  // definition of random_int omitted for brevity
if (spam === 42) {
    let egg = 43;
}
console.log(egg);
```

The compiler produces an error because the statement `console.log(egg)` is in the *global scope*, but `egg` was declared in the inner scope of the `if` statement. 
This is good because the **lifetime** of `egg` ends when we leave the scope of the `if` statement.
In a dynamically-typed language, the program might throw an exception if we tried to access `egg` after its lifetime ends.
We much prefer to have the compiler catch this before we run the program.

### Extra: Ask Dr. Perretta in Office Hours
What would that program do in Python and plain JavaScript?

## Extending the Lifetime
What if we try this instead?
```typescript
// Create a function that always prints "WAA", 
// assign it to a variable called func
let func = () => { 
    console.log("WAA"); 
}; 
let spam = random_int();
if (spam === 42) {
    let egg = "LUIGI";
    
    function inner_func() {
        console.log(egg);
    }
    func = inner_func;
}
func();
```
We might expect this to also cause an error--the lifetime of `egg` ends by the time we call `func`.
When we run the program, we see that about 50% of the time it prints "WAA" and the other 50% of the time it prints "LUIGI".

Why does this work? When a function uses a name defined in an outer scope, it **extends the lifetime** of that name (by extending the lifetime of that outer scope).
This is referred to formally as a **closure**.

# Ways we can use Closures

## Store read-only state
Here we present a motivating use case and show how using closures to store state can provide an expressive solution

### Motivating Use Case: Form Field Validation
As an example, imagine we are designing a library for user input forms. 
Programmers using the library to implement forms will construct "fields" (e.g., name, age, reservation party size) and need a way to specify what valid inputs are for those fields.
Rather than requiring the programmer to always write custom code to validate each field, our library will instead take in a list of "validator" functions. 
A validator function takes in the field value as a parameter and throws an exception if that value is invalid.
```typescript
// We'll just use numbers as field values for simplicity
type ValidatorFunc = (value: number) => void;

function define_field(field_name: string, validators: ValidatorFunc[]) { 
    ...  // Construct the field and set validators to run
}
```

Suppose the programmer needs to create an "age" field in one form and a "reservation party size" in another form.
Suppose age must be >= 0, and reservation party size must be >= 2.
The programmer would create these fields by writing two custom validator functions.
As you read the code below, think about: What problems from a code quality standpoint does this create?

```typescript
function validate_non_negative(value: number) {
  if (value < 0) {
    throw new Error('Value must be >= 0');
  }
}

const age_field = define_field('Age', [validate_non_negative]);

function validate_greater_than_1(value: number) {
  if (value < 2) {
    throw new Error('Value must be >= 2');
  }
}

const age_field = define_field('Party Size', [validate_greater_than_1]);
```

We've encountered a similar problem before.
Before we had arrow functions, we had to define custom functions to pass to `map`, `filter`, etc. even though those custom functions did not improve the understandability of the code.
Would arrow functions solve this problem?
Not quite--consider what that code would look like:
```typescript
const age_field = define_field("Age", [
  (value: number) => {
    if (value < 0) {
      throw new Error("Value must be >= 0");
    }
  },
]);
```
While this saves us the trouble of having to define the validator function separately before using it, we've lost the expressivity of the name of the validator function.
On top of that, we can imagine how quickly this would get out of hand when defining multiple fields with multiple validators each.
We could end up with a tremendous amount of duplicated code.

### Solution: A function that creates "validate" functions

Recall the duplicated validator structure from before:
```typescript
function validate_non_negative(value: number) {
  if (value < 0) {
    throw new Error("Value must be >= 0");
  }
}

function validate_greater_than_1(value: number) {
  if (value < 2) {
    throw new Error("Value must be >= 2");
  }
}
```

Notice that the only difference between these functions is the number in the comparison and error message.
We can use closures to write a `min_value_validator` function that will generate validator functions in an expressive way.

```typescript
function min_value_validator(min: number) {
  function validator(value: number) {
    if (value < min) {
      throw new Error(`Value must be >= ${min}`);
    }
  }
  return validator;
}
```

Alternatively, we could use an arrow function:

```typescript
function min_value_validator(min: number) {
  return (value: number) => {
    if (value < min) {
      throw new Error(`Value must be >= ${min}`);
    }
  }
}
```

Now we can create our form fields in a much more expressive way:

```typescript
const age_field = define_field("Age", [min_value_validator(0)]);
const party_size_field = define_field("Party Size", [min_value_validator(2)]);

age_field.check(-1);  // throws Error
age_field.check(0);  // ok
age_field.check(1);  // ok
party_size_field.check(0);  // throws Error
party_size_field.check(2);  // ok
party_size_field.check(3);  // ok
```

## Store and update state
In the code below, we define a class `Countdown` that takes in an initial value.
Each time we call the member function `tick`, it returns the current count and decrements the count.
When the count reaches zero, it stops counting down.
```typescript
class Countdown {
    constructor(public count: number) {}
    
    tick(): number {
        if (this.count == 0) {
            return this.count;
        }
        
        const to_return = this.count;
        this.count -= 1;
        return to_return;
    }
}

const c = new Countdown(3);
console.log(c.tick(), c.tick(), c.tick(), c.tick());
```
```
3 2 1 0
```

It turns out that we can also achieve similar behavior without writing a class.

Side note: Sometimes writing a class is the right approach, and sometimes what you're about to see next is the right approach. 
This is a nuanced topic that Dr. Perretta would enjoy chatting about in office hours. :)

To accomplish this, we'll write a function that **creates and returns another function.**
By creating a **closure** we can effectively create functions that can **encapsulate state and functionality** together.
```typescript
function make_countdown(initial_count: number) {
    let count = initial_count;

    function countdown() {
        if (count === 0) {  // extend the lifetime of count by referring to it in an inner scope
            return count;
        }

        let to_return = count;
        count -= 1;
        return to_return;
    }

    return countdown;
}

let c = make_countdown(3);
console.log(c(), c(), c(), c());
```
```
> tsc --strict demo.ts && node demo.js

3 2 1 0
```

There are a few syntactic differences, but the result is the same.
(Side note: There are ways to remove those syntactic differences. Ask Dr. Perretta in office hours!)

### Closures + Higher-Order Functions
Using closures together with higher order functions opens up new possibilities.
Consider the python built-in function `enumerate` that takes in a list (technically any iterable, but we'll just use lists for simplicity) and returns a list of `(n, item)` pairs where `n` is the index of the item and `item` is the actual item.

We can implement this function using map and a closure.
```typescript
function enumerate<T>(items: T[]) {  // Ask Dr. Perretta how to notate this function's return type
    let index = 0;
    return items.map((item) => {
        let to_return = [index, item];
        index += 1;
        return to_return;
    });
}
console.log(enumerate(["waaa", "luigi", "time"]));
```
```
[ [ 0, 'waaa' ], [ 1, 'luigi' ], [ 2, 'time' ] ]
```

## "Wrap" functions to add behavior to them

Suppose we have these two functions that sometimes throw an exception.
We use a random number generator to simulate parts of a system that fail at unpredictable times, e.g., network connections.

```typescript
function defrangulate() {
    if (random_int() !== 42) {
        throw new Error("NOOOOOO");
    }
    return "such meaning!";
}

function zap() {
    if (random_int() !== 43) {
        throw new Error("WAAAAAAAAA");
    }
    return "WALUIIIIGI TIME!";
}
```

Suppose we want to print out the error messages when these functions throw an exception.
We might want to write them to a special log file or report them to an external error-tracking system, but for simplicitly we'll just print them to the console.
One (not so good) option would be to wrap every call to these functions in a try-catch.

```typescript
try {
    defrangulate();
} catch(e) {
    console.log(e);
    throw e;
}

try {
    zap();
} catch(e) {
    console.log(e);
    throw e;
}
```

This would start to get very repetitive very quickly.
Additionally, there's the chance that we might miss a place where we call one of those functions and not have enough live system information printed when we try to examine what went wrong.

Instead, we can write another function that wraps or **decorates** these functions.

```typescript
function log_error(func: () => string) {
  function decorated() {
    try {
      return func();
    } catch (e) {
      console.log("Error detected:", e);
      throw e;
    }
  };
  return decorated;
}
```

The term for functions like `log_error` that wrap other functions is a **decorator**. 
Note that we could also return the inner `decorated` function directly as an arrow function with curly braces.

`log_error` **takes in a function** and **returns a new function**. 
The returned function calls the function that was passed into `log_error`, but it wraps the call in a try-catch.

We have one more step, which is replacing the original function object with a decorated one.
In order to do this in typescript, we have to define our functions slightly differently.
We put the body of defrangulate in an arrow function and pass that arrow function to log_error

```typescript
const defrangulate = log_error(() => {
  if (random_int() !== 42) {
    throw new Error("NOOOOOO");
  }
  return "such meaning!";
});
```

Now, every time we call `defrangulate`, we get the error-logging behavior for free!
Let's do the same thing with `zap`.

```typescript
const zap = log_error(() => {
  if (random_int() !== 43) {
    throw new Error("WAAAAAAAAA");
  }
  return "WALUIIIIGI TIME!";
});
```
