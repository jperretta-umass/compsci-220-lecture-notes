# Object-Oriented Programming & Other Useful Things

In this lesson, we review some object-oriented programming (OOP) mechanisms and techniques in the context of TypeScript.
We also present a few assorted things that are useful to know in TypeScript that are not necessarily related to OOP.

**Table of Contents**
1. [Object-Oriented Programming & Other Useful Things](#object-oriented-programming--other-useful-things)
1. [Classes, Inheritance, Composition, and Interfaces in TypeScript](#classes-inheritance-composition-and-interfaces-in-typescript)
    1. [Single Inheritance ("is-a") with an Abstract Base Class](#single-inheritance-is-a-with-an-abstract-base-class)
        1. [Overriding a Method](#overriding-a-method)
    1. [Using Composition ("has-a") Instead of Inheritance for Movement](#using-composition-has-a-instead-of-inheritance-for-movement)
    1. [Interfaces](#interfaces)
1. [Plain-old-data (POD) Types](#plain-old-data-pod-types)
1. [Returning Multiple Values from a function](#returning-multiple-values-from-a-function)
    1. [Option 1: A POD Class](#option-1-a-pod-class)
    1. [Option 2: Return a Tuple & _Destructure_ It](#option-2-return-a-tuple--_destructure_-it)
    1. [Option 3: Return an Object Literal & Destructure It](#option-3-return-an-object-literal--destructure-it)
        1. [More About Object Literals](#more-about-object-literals)
1. [`Array.forEach`](#arrayforeach)

# Classes, Inheritance, Composition, and Interfaces in TypeScript

The sub-sections that follow will go through a series of examples using a `Swallow` and `Duck` class to demonstrate OOP techniques.

## Single Inheritance ("is-a") with an Abstract Base Class

Suppose we have classes `Duck` and `Swallow` (shown below).
Both classes have a `talk` method that prints the sound they make.
Both also have a movement speed, current location, and a method to move instances one unit of time closer towards a location.

```typescript
class Swallow {
  constructor(
    private speed: number,
    private location: number,
  ) {}

  talk() {
    console.log("Tweet");
  }

  getSpeed() {
    return this.speed;
  }

  getLocation() {
    return this.location;
  }

  setDestination(location: number) {
    // Move one time unit towards the given location. Omitted for brevity.
  }
}

class Duck {
  constructor(
    private speed: number,
    private location: number,
  ) {}

  talk() {
    console.log("Quack");
  }

  getSpeed() {
    return this.speed;
  }

  getLocation() {
    return this.location;
  }

  setDestination(location: number) {
    // Move one time unit towards the given location. Omitted for brevity.
  }
}
```

We see quite a bit of duplication between the `Swallow` and `Duck` classes.
Let's make a first attempt at reducing this duplication while also adding expressivity by introducing an **abstract base class** for Swallow & Duck to inherit from.

Similar to Java, TypeScript, supports single inheritance using the `extends` keyword.
We use this to represent an "is-a" relationship.
We mark the class as **abstract** (meaning we cannot instantiate it directly) using the `abstract` keyword.

```typescript
abstract class Bird { ... }
```

Since an abstract `Bird` doesn't have one sound that it makes,
we'll also mark the `talk` method as abstract in the `Bird` base class.
This means that any class that inherits from `Bird` must implement `talk` (or also declare `talk` as abstract).

```typescript
abstract class Bird {
  abstract talk(): void;
}
```

We can also refactor the location & movement behavior into this base class
(note: there's a potential design problem with this approach that we'll discuss later).

```typescript
abstract class Bird {
  constructor(
    private speed: number,
    private location: number,
  ) {}

  abstract talk(): void;

  getSpeed() {
    return this.speed;
  }

  getLocation() {
    return this.location;
  }

  setDestination(location: number) {
    // Move one time unit towards the given location. Omitted for brevity.
  }
}
```

In our derived classes, we can now just override the behavior(s) that we need to override.
TypeScript supports single inheritance using the `extends` keyword.

```typescript
class Swallow extends Bird {
  override talk() {
    console.log("Tweet");
  }
}

class Duck extends Bird {
  override talk() {
    console.log("Quack");
  }
}

const swallow = new Swallow(1, 42);
swallow.talk();
const duck = new Duck(3, 43);
duck.talk();
```

Note that since `Swallow` and `Duck` don't need to initialize any of their own
member variables, we do not need to add a constructor to these classes.

### Overriding a Method

Suppose we want to add some functionality to `Swallow`.
Let's say that swallows can carry coconuts, and that their speed
is reduced by one for each coconut they're carrying.
To add this functionality, we can add a member variable representing
the number of coconuts being carried, and we'll then override
`getSpeed` to adjust its speed dynamically.
We use the `super` keyword to call the base-class version
of `getSpeed`.

```typescript
class Swallow extends Bird {
  // Note that we declare speed and location as parameters to the constructor,
  // but we do NOT re-declare them as member variables with the `private` keyword
  constructor(
    speed: number,
    location: number,
    private numCoconuts: number,
  ) {
    super(speed, location);
  }

  override getSpeed(): number {
    // Call the base class version of getSpeed()
    const baseSpeed = super.getSpeed();
    return Math.max(0, baseSpeed - this.numCoconuts);
  }

  override talk() {
    console.log("Tweet");
  }
}
```

## Using Composition ("has-a") Instead of Inheritance for Movement

What if our application also has an Airplane class that has the same movement
logic as our Bird class?
Does it make sense to write another abstract base class that Bird and Airplane
inherit from?
Possibly, but what if we had other entities in our application that have a location
but don't move (e.g., tree, airport?

The exact right choice might be different depending on the application but
in situations like this, it may be a better choice to use **composition** ("has-a")
instead of inheritance ("is-a").
This becomes increasingly useful the more of these "capability" behaviors we have in
different parts of our class hierarchy.

In this approach, we'll write a separate `Movement` class that encapsulates
the functionality of moving from location to location and add an
instance of that class as a member variable
in classes that need to implement movement.

```typescript
class Movement {
  private destination: number;
  // We can set a default speed of zero
  private speed: number = 0;

  constructor(private location: number) {
    // Set the initial destination to the current location
    this.destination = location;
  }

  getSpeed() {
    return this.speed;
  }

  setSpeed(speed: number) {
    this.speed = speed;
  }

  getLocation() {
    return this.location;
  }

  setDestination(destination: number) {
    this.destination = destination;
  }

  move() {
    // Move towards destination. Omitted for brevity.
  }
}
```

Now we can update our Bird class to get its movement functionality
from `Movement` instead of implementing it from scratch.
Now the movement-related member functions "wrap" the Movement
class functionality by just calling the appropriate method.

```typescript
abstract class Bird {
  private movement: Movement;

  // We still take in speed and location in the constructor, but that's OK
  constructor(
    private speed: number,
    private location: number,
  ) {
    this.movement = new Movement(location);
    this.movement.setSpeed(speed);
  }

  abstract talk(): void;

  getSpeed() {
    return this.movement.getSpeed();
  }

  getLocation() {
    return this.movement.getLocation();
  }

  setDestination(location: number) {
    this.movement.setDestination(location);
  }

  move() {
    this.movement.move();
  }
}

class Swallow extends Bird {
  // Note that we declare speed and location as parameters to the constructor,
  // but we do NOT re-declare them as member variables with the `private` keyword
  constructor(
    speed: number,
    location: number,
    private numCoconuts: number,
  ) {
    super(speed, location);
  }

  override getSpeed(): number {
    // Call the base class version of getSpeed()
    const baseSpeed = super.getSpeed();
    return Math.max(0, baseSpeed - this.numCoconuts);
  }

  override talk() {
    console.log("Tweet");
  }
}

// The Duck class doesn't have to change at all.
```

as before, including where `Swallow` overrides
getSpeed to account for the weight of the coconuts.
If we decided that `Bird` didn't need to have a public `getSpeed`
method, we could mark it as `protected` so that `Swallow` can still
override it:

```typescript
abstract class Bird {
  // Rest of class as before

  protected getSpeed() {
    return this.movement.getSpeed();
  }

  // ...
}
```

## Interfaces

What if we needed to store an array of all different types of objects that have
the Movement capability?
How would we declare the type of this array?

```typescript
const movableObjects = [
  new Duck(...),
  new Swallow(...),
  new PassengerJet(...),
  ...
];
```

We can define an `interface`, which declares what methods and
attributes a class should have but doesn't provide any functionality.
In some languages, interfaces can only declare methods.
In TypeScript and some other languages, interfaces can declare methods
and attributes.

When a class declares that it implements this interface using the `implements`
keyword, it must define all of the required methods and attributes itself
(or inherit them from a class it extends).
Like in Java, classes can `extend` only one class but can `implement`
more than one interface.

We might define our `Movable` interface like this. Note that exactly which methods we declare
would depend on the details of our application.

```typescript
interface Movable {
  getLocation(): void;

  setDestination(location: number): void;

  move(): void;
}
```

This will let us declare the type of our movableObjects array:

```typescript
const movableObjects: Movable[] = [
  new Duck(...),
  new Swallow(...),
  new PassengerJet(...),
  ...
];
```

# Plain-old-data (POD) Types

Sometimes it makes sense for our application to have types that have multiple member variables bundled together in a meaningful way but no methods that operate on them.
We refer to this as a "plain-old-data" (POD) type.
In languages like C/C++, these are typically represented by structs.
In TypeScript and other languages, we can use classes for this purpose.

The `Reservation` class below is a POD type.
All its member variables are public, which is necessary because it has no methods and does not maintain its own state.
This does not violate any OOP principles, as POD types are purely for bundling data together in an expressive way.
Note that we've marked the `id` member variable as `readonly`, which is similar to `const` in that it cannot be reassigned after the object is constructed.

```typescript
class Reservation {
  // public is the default in TypeScript
  // readonly is like const but for member variables
  // (it can't be reassigned after being initialized)
  readonly id: string;
  name: string;
  partySize: number;

  constructor(id: string, name: string, partySize: number) {
    this.id = id;
    this.name = name;
    this.partySize = partySize;
  }
}
```

This does what we need it two, but it's a bit cumbersome to have to declare the member variables, declare constructor parameters for each one, and initialize each one.
Some languages provide less verbose ways of defining POD types.
For example, Python has [dataclasses](https://docs.python.org/3/library/dataclasses.html).
In TypeScript, we can use a shorthand syntax in the constructor parameter list.
The POD definition below is equivalent to the one above.

```typescript
class Reservation {
  constructor(
    public readonly id: string,
    public name: string,
    public partySize: number,
  ) {}
}
```

# Returning Multiple Values from a function

Say we have a function `moveTowards` that takes in a starting position,
destination, and speed.
The function computes our new position and distance traveled.
If we would move past the destination, our new position is the destination.
Otherwise, we move `speed` distance to some new position.

What if we want this function to return both the new position and
the distance traveled?

## Option 1: A POD Class

One option would be to write a plain-old-data (POD) class and return an instance of that.

The question then becomes: What do we call the POD class?

```typescript
function moveTowards(start: number, destination: number, speed: number) {
  const distanceToDestination = destination - start;
  if (distanceToDestination < speed) {
    return new WatDoICallThis(destination, distanceToDestination);
  }
  return new WatDoICallThis(start + speed, speed);
}

class WatDoICallThis {
  constructor(
    public newLocation: number,
    public distanceMoved: number,
  ) {}
}

const result1 = moveTowards(1, 5, 3);
console.log(
  `Moved ${result1.distanceMoved} units to location ${result1.newLocation}`,
);
const result2 = moveTowards(3, 5, 3);
console.log(
  `Moved ${result2.distanceMoved} units to location ${result2.newLocation}`,
);
```

What should we call our POD class? MovementInfo? NewPositionAndDistanceMoved? MovementResult?
None of these options seem particularly expressive.

## Option 2: Return a Tuple & _Destructure_ It

Since we don't have a meaningful name for our POD class, another option is to return a **tuple** containing both values.
Python has a built-in `tuple` type, but JavaScript does not.
In TypeScript, we can use arrays for this purpose, but we use a type annotation
that lets us safely use the array like a tuple.

In the code below, we declare the return type as `[number, number]`, which tells
the type checker to expect a tuple containing two numbers.

```typescript
function moveTowards(
  start: number,
  destination: number,
  speed: number,
  // Declare return type as tuple of 2 numbers
): [number, number] {
  const distanceToDestination = destination - start;
  if (distanceToDestination < speed) {
    return [destination, distanceToDestination];
  }
  return [start + speed, speed];
}
```

We get an additional benefit when we call this function.
Instead of assigning the tuple to a variable and indexing into it like this:

```typescript
const result1 = moveTowards(1, 5, 3);
console.log(`Moved ${result1[1]} units to location ${result1[0]}`);
const result2 = moveTowards(3, 5, 3);
console.log(`Moved ${result2[1]} units to location ${result2[0]}`);
```

We can **destructure** the tuple into separate variables:

```typescript
const [newLocation, distanceMoved] = moveTowards(1, 5, 3);
console.log(`Moved ${distanceMoved} units to location ${newLocation}`);

// We can choose any variable names we want
const [newLocation2, distanceMoved2] = moveTowards(3, 5, 3);
console.log(`Moved ${distanceMoved2} units to location ${newLocation2}`);
```

This typically works well when we're only returning two values.
Three _might_ be alright, but you should definitely have a good reason.

The downside is that we have to keep track of the order of the values
in the tuple, and since in this case they're the same type, the type
checker won't alert us if we mix them up (I made this mistake while
writing these notes!).

What we want here is something that lets us keep
the expressivity of the names without having to write a class that (in
this case) doesn't help us understand the code more easily.

## Option 3: Return an Object Literal & Destructure It

Our last JavaScript-specific option is to use an **object literal**.
Syntactically, this looks similar to Python's dictionary syntax, but
it is **not the same**.
An object literal is like creating an instance of a class without writing
a class.

```typescript
function moveTowards(start: number, destination: number, speed: number) {
  const distanceToDestination = destination - start;
  if (distanceToDestination < speed) {
    return { newLocation: destination, distanceMoved: distanceToDestination };
  }
  return { newLocation: start + speed, distanceMoved: speed };
}
```

When we call `moveTowards`, we can **destructure** the object:

```typescript
// If we use the same variable names as in the object literal, we
// can use this syntax:
const { newLocation, distanceMoved } = moveTowards(1, 5, 3);
console.log(`Moved ${distanceMoved} units to location ${newLocation}`);

// If we want to use different variable names, we use this syntax
// (yes, this feels backwards to me too, but I promise it's right):
const { newLocation: newLocation2, distanceMoved: distanceMoved2 } =
  moveTowards(3, 5, 3);
console.log(`Moved ${distanceMoved2} units to location ${newLocation2}`);
```

### More About Object Literals

The JSON (JavaScript Object Notation) data format comes from this syntax.

While it can be tempting to use object literals everywhere instead of writing a class, it's important to think critically about which is more expressive.
The purpose of object literals is not to save us typing or make our code fewer characters.
It has a handful of specific use cases, such as object destructuring like we saw here, as syntax for dictionary-like configuration files, writing a function that takes in the JavaScript equivalent of keyword arguments, and working with data in JSON format.
If you find yourself using object literals just to avoid the minor inconvenience of writing a class, remember that code is meant to be **read** and just write the class. :)

# `Array.forEach`

For me, this falls into the category of "things you should know about in case you encounter it in the wild."
Arrays in JavaScript have another higher-order method called `.forEach`.
It is essentially equivalent to writing a range-based for-loop.

```typescript
class Parrot {
  constructor(public age: number) {}
}

const parrots = [new Parrot(42), new Parrot(43)];

// range-based for-loop
for (const parrot of parrots) {
  parrot.age += 1;
}
console.log(parrots);

// Array.forEach
// We could remove the curly braces and write this on one line,
// but I find that makes it harder to read. :)
parrots.forEach((parrot) => {
  parrot.age += 1;
});
console.log(parrots);
```

When should you use one over the other?
Personally, I'll almost always use a range-based for-loop (i.e., `for...of`) instead of `.forEach` if the language I'm using has range-based for-loops.

The last time I used a language's equivalent of `.forEach` was around 2013-2014 when we were still using C++98, which didn't have range-based for-loops.
C++11 (which added range-based for-loops) was still fairly new, and some of my courses hadn't switched over yet.
Having programmed in Python and Java before C++98, I found the lack of range-based for-loops disappointing.

Thank you for indulging me in this tangent. :)
