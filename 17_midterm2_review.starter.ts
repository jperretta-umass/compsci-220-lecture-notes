// These questions are intended to provide additional practice with the
// topics covered on the exam.

import assert from "assert";

// ------------------------------- Iterators & Generators ------------------------------------

// Implement an iterable iterator class Hailstone initialized with a number as input
// that produces elements in the hailstone sequence.
// The sequence is defined as follows:
// - Start at the given number
// - If the number is even, divide it by two (round down)
// - If the number is odd multiply it by three, then add one


// Implement the function fibonacci that returns a generator
// that produces values in the fibonacci sequence.


// Implement a function sliceUntil that takes in an iterable, a start index,
// and a unary predicate function. It should return an iterable iterator
// that produces values from the given iterable starting at the given
// index and stopping as soon as calling the predicate on an element returns false.
// Implement this once using a custom iterator class and once using generators.

function sliceUntil<T>(
  iterable: Iterable<T>,
  startIndex: number,
  stopWhen: (item: T) => boolean,
): IterableIterator<T> {
  throw new Error("Not implemented yet");
}


console.log("sliceUntil");
console.log(
  Array.from(sliceUntil([1, 3, 5, 6, 7, 8, 9], 0, (item) => item % 2 === 0)),
);
console.log(
  Array.from(sliceUntil([1, 3, 5, 6, 7, 8, 9], 1, (item) => item % 2 === 0)),
);
console.log(
  Array.from(sliceUntil([1, 3, 5, 6, 7, 8, 9], 2, (item) => item % 2 === 0)),
);
console.log(
  Array.from(sliceUntil([1, 3, 5, 6, 7, 8, 9], 3, (item) => item % 2 === 0)),
);

// ----------------------- MVC ------------------------------------

// 1. A MVC application currently supports a single View.
//    Which parts of the application must be modified to support
//    a second View that displays the same data differently?
// a) Model
// b) View
// c) Controller
// d) Model & View
// e) Controller & View
// f) Model & Controller
// g) Model, Controller, & View


// 2. Which view classes need to be modified to support the change in question #1?
// a) View base class
// b) View derived class
// c) Both a & b
// d) Neither a nor b


// 3. Which part of MVC processes commands from the user?
// 4. Which part of MVC displays information to the user?
// 5. Which part of MVC manages the application's "business logic"?
// 6. Which direction does information flow between each of these pairs in the
//    version of MVC we covered in class? Describe each in at most one sentence.
// Model         View
// View          Controller
// Controller    Model

// ---------------------------- Observer pattern ------------------------------------

// Consider the relationship between the Farm class and the abstract Animal class.
// What is the main problem with how these classes interact?
//
// Refactor this code to use the observer pattern:
// 1. Identify which class(es) should be the subject and which should be the observer(s).
// 2. Write an interface for the observers to implement.
// 3. Modify the subject class to let observers subscribe and unsubscribe.
// 4. Modify the appropriate subject method(s) to broadcast to the observers when appropriate.
// 5. Modify the observer class(es) to receive updates from the subject.

class Farm {
  private _animals: Animal[];

  constructor(animals: Animal[]) {
    this._animals = animals;
  }

  feeding_time(food: string) {
    for (const animal of this._animals) {
      if (animal instanceof Chicken) {
        if (food === "worms") {
          animal.eat(food);
        } else {
          animal.talk();
        }
      }
      if (animal instanceof Llama) {
        if (food === "llama snack") {
          animal.eat(food);
        } else if (food === "spam") {
          animal.spit();
        } else {
          animal.talk();
        }
      }
    }
  }
}

abstract class Animal {
  abstract talk(): void;

  eat(food: string): void {
    console.log("Ate " + food);
  }
}

class Chicken extends Animal {
  talk(): void {
    console.log("BCAAAW");
  }
}

class Llama extends Animal {
  talk(): void {
    console.log("Llaaaama!");
  }

  override eat(food: string): void {
    console.log("Om nom nom " + food);
  }

  spit() {
    console.log("PTUEY!");
  }
}


// ---------------------------------- Property-based testing ----------------------

// Write property-based tests for the function crosswordGenerator(n: number, m: number).
// crosswordGenerator produces a 2D array (n rows, m columns) of characters (strings with one letter).
// The letters in any two adjacent non-empty cells in a crossword must be a dictionary word.
// Empty cells are represented by an empty string.
// Assume a function isWord(str: string) is provided for you that returns true if str is a dictionary word.
// Assume a function isAlpha(str: string) is provided for you that returns true if str contains only
// alphabetical characters.
// You may implement additional helper functions to reduce code duplication in your solution.
//
// In answering this question, first articulate all the properties to check, then figure out
// how to turn those checks into code.
// Note that this question may be longer than what I would expect you to do on a paper exam.

function crosswordGenerator(n: number, m: number): string[][] {
  // implementation omitted because it would be quite complicated
  return [];
}

function isAlpha(str: string) {
  // implementation omitted for brevity
  return false;
}

function isWord(str: string) {
  // implementation omitted for brevity
  return false;
}

function testCrosswordGenerator(n: number, m: number) {
}

// -------------------------------------------

// Tells the compiler that this file should be treated as a module.
// This prevents errors for having symbols with the same name in different files.
export {};
