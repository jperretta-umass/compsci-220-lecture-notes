import { List } from "./include/lists";

/*

Implement the generic function find that, given an array and a predicate function
(takes in one argument and returns a boolean), returns the
first element of the array for which the predicate returns true.
If the predicate doesn't return true for any elements, returns undefined.
*/

// IMPLEMENT find HERE

/*

Write a set of 5 or fewer test input/output pairs that fully test the
behavior of the find function.

*/

/*
Implement the function cache that takes in a function and returns a closure.
It takes in a function that takes in a single number.
When the closure is called, it returns the same value that the original
function would return when called with the given argument.
If the closure has been called with that argument already, it still
returns the correct value, but it does not call the original function
to obtain the value.

Your solution can use a Map data structure or an array with .find or the find
function we implemented.

*/

// function cache<T>(func: (a: T) => T) {
//   let calls: CachedValue<T>[] = [];
// }

// class CachedValue<T> {
//   constructor(public param: T, public value: T) {}
// }

// Update the function cache so that the function it wraps can return a different
// type from what it takes in.

// /*

// What is the output of this code?
// (Since this is exam practice, don't run it--trace through on paper).

// */

// const cached1 = cache((a: number) => {
//   console.log(a);
//   return a + 3;
// });
// console.log(cached1(42));
// console.log(cached1(43));
// console.log(cached1(42));

// let spam = 42;
// const cached2 = cache((a: number) => {
//   spam++;
//   return spam + a;
// });
// console.log(cached2(1));
// console.log(cached2(2));
// console.log(cached2(3));
// console.log(cached2(1));
// console.log(cached2(2));
// console.log(cached2(3));

// // Draw the memory diagram for this next example as you determine the output
// // (use reference semantics for arrays and objects,
// // value semantics for numbers).
// // Notate Cheese objects as "Cheese(<name>, <age>)"
// class Cheese {
//   constructor(public readonly name: string, public age: number) {}
// }

// let grana = new Cheese("grana", 12);
// let grana2 = new Cheese("grana", 12);
// let parm = new Cheese("parmigiano", 42);

// let cached3 = cache((cheese: Cheese) => {
//   cheese.age++;
//   return cheese;
// });

// console.log(cached3(grana));
// console.log(cached3(grana2));
// console.log(cached3(grana));
// console.log(cached3(grana2));
// console.log(parm);
// console.log(parm);

// // Draw the memory diagram for this next example as you determine the output
// // (use reference semantics for arrays and objects,
// // value semantics for numbers).
// // Notate Cheese objects as "Cheese(<name>, <age>)"

// let cheddar = new Cheese("cheddar", 12);
// let cheddar2 = new Cheese("cheddar", 12);
// let brie = new Cheese("brie", 42);

// let cached4 = cache((cheese: Cheese) => {
//   return new Cheese(cheese.name, cheese.age + 3);
// });

// console.log(cached4(cheddar));
// console.log(cached4(cheddar2));
// console.log(cached4(cheddar));
// console.log(cached4(cheddar2));
// console.log(brie);
// console.log(brie);

// /*

// Implement the function find but for recursive lists. Your solution may not use list.filter.
// Your solution may not use loops.

// */

// function findList<T>(list: List<T>, pred: (elt: T) => boolean) {
// }
