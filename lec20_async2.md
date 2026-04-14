# Async Part 2 and Observer Pattern

## Warm-Up Exercise
The implementation of the `http_get` method below is **incorrect**.  
**Task:** Edit the implementation so that it correctly sequences the intermediate steps using the `.then()` and `.catch()` methods of `Promise`s.
The function calls in the implementation that return `Promise`s are indicated by comments.
The [solution](#warm-up-solution) is available towards the end of this document.

`http_get` attempts to follow the specification below:
* Given a URL as a parameter, makes an HTTP request for data from that URL.
* If the response from the website has an "ok" status, return the response data as JSON.
* If the response from the website does not have an "ok" status, throws an error indicating data could not be retrieved.
```typescript
function http_get(url: string) {
    // fetch makes an HTTP request and returns a Promise of a response
    const response = fetch(url);
    
    // Check whether the response from the website has OK status. 
    // `.ok` is a plain boolean
    if (!response.ok) {
        throw new Error(`HTTP request failed with status ${response.status}`);
        // TIP: Promise.reject("error message") constructs a promise 
        // whose state is "rejected". That is,
        // Promise.reject("WAAAALUIGI").catch((error) => console.log(error));
        // Prints "WAAAALUIGI" to the console. 
    }

    // .json() returns a Promise that resolves to the data parsed in JSON format.
    return response.json();
}
```

## `async` and `await` Keywords
Last time, we saw how returning a promise from within a `.then` or `.catch` callback can let us write more sequential code that helps us avoid "Callback Heck".
Nonetheless, it's still a hassle to maintain these callback chains and to have to wrap everything in a callback.

Recall how the `yield` keyword in generators let us write more expressive code for problems that lend themselves to iterative solutions.
We can do something similar with promises using the `async` and `await` keywords.

Consider this function `read_file_strip` that reads the contents of a file and prints an error if the file couldn't be opened.
On success, it returns a `Promise` that resolves to the processed file contents.
On failure, it prints the error and returns a rejected `Promise`.
Note that we modified the example slightly by wrapping it in a function and having it trim leading and trailing whitespace from the file contents.
```typescript
import { readFile } from 'fs/promises';

function read_file_strip(filename: string) {
    return readFile(filename, {encoding: 'utf-8'})
        .then(
            (data) => {
                return Promise.resolve(data.trim());

            }
        )
        .catch(
            (error) => {
                console.log("I am error");
                console.log(error);
                return Promise.reject(error);
            }
        );
}
read_file_strip('spam.txt').then((content) => console.log(content));
read_file_strip('not_a_file').catch((error) => console.log(error));
```
```
> test
> tsc && node out/main.js

I am error
Error: ENOENT: no such file or directory, open 'not_a_file'
    at async open (node:internal/fs/promises:641:25)
    at async readFile (node:internal/fs/promises:1245:14) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: 'not_a_file'
}
Error: ENOENT: no such file or directory, open 'not_a_file'
    at async open (node:internal/fs/promises:641:25)
    at async readFile (node:internal/fs/promises:1245:14) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: 'not_a_file'
}
spam
egg
sausage
spam
```

`async` and `await` let us write code that looks synchronous, but stil runs asynchronously.
```typescript
// The async keyword lets us use the await keyword within the function.
// You can think of it as analogous to function* letting us use the yield keyword.
// async also makes the function always return a Promise, even if
// we don't have a return statment.
async function read_file_strip(filename: string) {
    try {
        // The await keyword is syntactic sugar for registering
        // a callback with .then and/or .catch.
        // If the Promise is fulfilled, the code continues
        // sequentially.
        // If the Proise is rejected, an exception is thrown, which
        // we can handle in the catch block below.
        const content = await readFile('spam.txt', {encoding: 'utf-8'});
        // We can return values directly without wrapping them
        // in a promise.
        return content.trim();
    } catch (error) {
        console.log("I am error");
        console.log(error);
        // We can throw exceptions (new ones or re-throwing) directly
        // instead of creating a rejected Promise with Promise.reject
        throw error;
    }
}
```
### `async` and `await` `http_get` Exercise
Re-write your implementation of `http_get` from the [warm-up exercise](#warm-up-exercise) to use `async` and `await`.
A [solution](#-async-and-await-http_get-solution) can be found towards the end of this document.

## Exercise Solutions
### Warm-Up Solution
```typescript
function http_get(url: string) {
    return fetch(url)
        .then((response) => {
            if (!response.ok) {
                return Promise.reject(`HTTP request failed with status ${response.status}`);
            }
            return response.json();
        });
}
```

### `async` and `await` `http_get` Solution
```typescript
// Declare the function as async, which lets us use the await keyword.
async function http_get(url: string) {
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`HTTP request failed with status ${response.status}`);
    }

    // If you wrote "return await response.json()", that is also correct.
    // Explanation below.
    return response.json();
}
```
If you wrote `return await response.json()`, that is also correct.
Since the function is marked as async, it has to return a promise.
This gives us two options:
1. `return await response.json()`: First, `await response.json()` evaluates to the **value** produced by the fulfilled `Promise` returned by `response.json()`. Then, when we return that value from an `async` function, the value is automatically wrapped in a fulfilled `Promise` that resolves to that value.
2. `return response.json()`: Since `response.json()` itself returns a `Promise`, and since `async` functions return a `Promise`, we can return the `Promise` from `response.json()` directly. The language handles this automatically.
