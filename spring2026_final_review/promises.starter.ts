// Implement the function validateData that takes in a Promise<number[]>
// - If the promise is fulfilled, checks whether the array is empty.
//   - If the array is empty, returns a promise that rejects with the message
//     "data must not be empty". Otherwise, returns a promise that resolves
//     to an array containing only numbers greater than 0. Each number greater
//     than zero should have 42 added to it in the result.
// You may not use loops or recursion.
// Implement this function once using promise methods
// and once as an asyncronous function. In the asynchronous version, add the
// behavior below:
// - If the promise rejects, returns a promise that rejects with the message
// "error loading data".

export function validateData(data: Promise<number[]>) {
}

