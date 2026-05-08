# Asynchronous Programming
Consider the following Python code that prints a message, waits for 1 second, prints a second message, waits for 1 more second, then prints a third message.
```python
import time

print('Waaaaaaaaaa')
time.sleep(2)
print('luigi')
time.sleep(1)
print('Time!')
```
```
$ python3 main.py

Waaaaaaaaaa
luigi 
Time!
```

JS/TS has a similar function `setTimeout`. 
The first difference between `setTimeout` and Python's `time.sleep` is that `setTimeout` takes in a **callback** function as a parameter and calls that callback after the specified delay.

Let's start with an example of calling `setTimeout` and passing a callback that prints one message.
The code below waits for 2 seconds, then prints the message.
```typescript
setTimeout(() => console.log('Waaaaaaaa'), 2000);  // setTimeout's delay is in milliseconds
```
```
> tsc && node out/main.js

Waaaaaaaa
```

Now let's try to write something equivalent to our Python program above.
```typescript
console.log('Waaaaaaaa');
setTimeout(() => console.log('luigi'), 2000);
setTimeout(() => console.log('Time'), 1000);
```
```
> tsc && node out/main.js

Waaaaaaaa
Time!
luigi 
```

Huh? (Note: This might seem like "wat", but it isn't quite that!)
Why did the messages print out of order?
In this lesson, we'll answer that question and learn how to use the underlying mechanism responsible for that behavior.

## Concurrency
### Concurrency at a Glance
Concurrency is the ability of a computer to run multiple sequences of instructions in parallel (i.e., at the same time). 
In the Ancient Times (i.e., vaguely before  the year 2001), mainstream CPUs only had one core, meaning they could only run one instruction at a time.

And yet, it was still necessary for computer programs to give the illusion that multiple tasks were being run in parallel.
This was typically accomplished with the abstraction of **threads**.
With threads, the operating system, would arbitrarily make tasks "take turns" running on the CPU.

These days, CPUs tend to have at least four cores (which means they can truly run 4 tasks at once), and some programs even access resources that exist on **different computers.**

### Concurrency & JavaScript
One of the original design decisions of JavaScript was that it would not provide the threads abstraction.
That is, all JS programs run in a **single thread**.
Note that this doesn't mean that the browser itself can only use a single thread.
Programs written in JS, which are run by the browser's JS interpreter, only have a single thread.

## Demonstration: Browser Events
Consider a web page that has buttons on it.
When you click on a button, that triggers an **event**.
The JS code powering that web page registers **callback functions** to be called automatically when specific events are triggered.

Open a browser window and navigate to `about:blank` in the URL bar to open a blank page.
Next, open the developer console. 
The keyboard shortcut for this in Chrome/Chromium browsers is `ctrl + shift + j` on windows, cmd + shift + j on a mac last I checked.

For some initial setup, add two buttons to the page by pasting the code below into the developer console.
```javascript
function make_button(text) {
    const button = document.createElement('button')
    const text_node = document.createTextNode(text);
    button.appendChild(text_node);
    document.body.appendChild(button);
    return button;
}

const button1 = make_button('Waluigi');
const button2 = make_button('Time');
```

Next, let's register a **callback** for when the first button is clicked on.
Run this code in the developer console.
```
button1.addEventListener('click', (event) => console.log('Waluigi'));
```

Now, click on the "Waluigi" button. 
You should see the message "Waluigi" printed to the console.
Note that if you click on the "Time" button, nothing happens because we haven't registered any callbacks for when that button is clicked.

Let's now add a callback to the second button.
This callback will wait for 2 seconds before printing a message.
Run this code in the developer console.
```typescript
button2.addEventListener('click', (event) => {
    setTimeout(() => console.log('Time'), 2 * 1000);
});
```

Click on "Time" and you'll see a message print after a 2 second delay.
Now click on "Time" again and as fast as you can click on "Waluigi".
Critically, the 2 second delay does not **block** the program from continuing to run. 
We are still able to click other buttons and interact with the page even before "Time" prints.

## Synchronous vs. Asynchronous
In the [browser event demo](#demonstration-browser-events), we saw that we could still click buttons even when the most recent event callbacks hadn't completed yet.
In the code below, we also see that **when** the callbacks are triggered is related to the **order the background tasks finish**. 
In this case the "background" task is waiting for the specified amount of time.
```typescript
setTimeout(() => console.log('one'), 4000);
setTimeout(() => console.log('two'), 1000);
setTimeout(() => console.log('three'), 2000);
```
```
> tsc && node out/main.js

two
three
one
```

This is in contrast with Python's `time.sleep` that runs **synchronously**.
Recall that the print statements didn't run until the pending call to `time.sleep` completed.
```python
import time

print('Waaaaaaaaaa')
time.sleep(2)
print('luigi')
time.sleep(1)
print('Time!')
```
```
$ python3 main.py

Waaaaaaaaaa
luigi 
Time!
```

### Asynchronous Execution Order: The Stack and The Queue
When we call functions, recall that frames are added to the function call **stack**.
When one function calls another, execution immediately transfers to the function that was called (the "callee"), and the original function (the "caller") resumes after the callee finishes.

This still applies in asynchronous programs, but we also add a second piece: the **callback queue**.
The queue works something like this:
1. The current function running on the stack starts a "background" task and registers a callback function.
2. When the "background" task completes, the callback is added to the **queue**.
3. When the stack is empty, pop off the callback at the front of the queue, push it onto the stack, and run it.

We use the example below to illustrate this.
```typescript
function main() {
    setTimeout(() => {           // A
        console.log('Waluigi');  // B
    }, 1000);
    console.log("time");         // C
}
main();                          // D
```
* First, our `main` function is called (D), creating a stack frame for it.
* Second, in the body of `main`, `setTimeout` is called (A), creating a stack frame for it and transferring execution to the implementation of `setTimeout`.
  That implementation starts the background task of waiting for one second.
* Third, `setTimeout` returns, its stack frame is destroyed, and execution is transferred back to `main`.
* Fourth, `console.log("time")` is called (C), which prints "time" to the screen.
* Fifth, `main` returns and the stack is empty.
* Sixth(-ish), whenever the background task of waiting for one second finishis, the callback function passed to `setTimeout` is added to the **queue**.
* Seventh, since the stack is empty, the callback at the front of the queue (the one passed to `setTimeout`) is removed from the queue and pushed onto the stack.
* Eighth, execution transfers to the callback that is now on the stack.
* Finally, "Waluigi" is printed by the callback (B)

The execution order of the program is therefore (D), (A), (C), (B).

## Controlling the Order of Callbacks

### "Callback Heck"
If we make multiple calls to `setTimeout` with different delays, the delays all start at roughly the same time.
In the code below, the callback in the second line will run after one second, then the callback in the third line will run one second later, and finally the first callback will run two seconds after that.
The whole program takes about 4 seconds to run, not 7.
```typescript
setTimeout(() => console.log('one'), 4000);
setTimeout(() => console.log('two'), 1000);
setTimeout(() => console.log('three'), 2000);
```
```
> tsc && node out/main.js

two
three
one
```

What if we wanted to make these delays happen sequentially?
The first way we can accomplish this is by nesting the calls to `setTimeout` in our callbacks.
```typescript
setTimeout(() => {
    console.log('one');
    setTimeout(() => {
        console.log('second');
        setTimeout(() => {
            console.log('third');
        }, 500);  // third delay
    }, 1000);  // second delay
}, 2000);  // first delay
```

This code seems...not great.
Imagine if we wanted to add another message between "second" and "third"?
We'd have to add another level of nested callbacks.
```typescript
setTimeout(() => {
    console.log('one');
    setTimeout(() => {
        console.log('second');
        setTimeout(() => {
            console.log('two and a half')
            setTimeout(() => {
                console.log('third');
            }, 500);  // third delay
        }, 1000);  // newly-added delay
    }, 1000);  // second delay
}, 2000);  // first delay
```
Nested callbacks like this were commonplace in the earlier days of web programming.
Because of how this makes the code harder to read and maintain, this has been referred to with a stronger version of the phrase "callback heck".

## Promises and Asynchronous Code
The `Promise` class provides a cleaner way to control the order in which callbacks are called.
To introduce a few key aspects of the `Promise` class, let's look at a more compelling example from web programming.

In the code below, we use the `fetch` method to retrieve some data from a website.
`fetch` sends a **request** over the internet for the data, and the website sends back a **response**.
While the request is being processed, `fetch` returns a `Promise`, and we call the `then` method on that promise to register a callback function that prints the website's response.
Note that we've omitted most of the response object's attributes for brevity and 
annotated the output to explain certain attributes.
```typescript
fetch('https://people.cs.umass.edu/~joydeepb/yelp-tiny.json')  // fetch returns Promise<Response> 
    .then(response => console.log(response));  // The Response is passed to the callback
    // .then takes in a callback function that takes in one parameter of type Response
```
```json
> tsc && node out/main.js

Response {
  // body contains the raw response data
  body: ReadableStream { ... },
  // Whether the response succeeded according to the website.
  // For example, whether the website has a file called "yelp-tiny.json".
  ok: true,

  status: 200,
  statusText: 'OK',
  headers: Headers { ... },
  url: 'https://people.cs.umass.edu/~joydeepb/yelp-tiny.json'
}
```

The printed response object has information about whether the website was able to process the request, but we want the actual data from the website.
For our purposes, we want the data to be encoded as JSON (JavaScript Object Notation), which essentially gives us an Object literal (e.g., `{spam: 42, egg: 43}` is an object literal).

According to the documentation, `Response` conveniently has a [`.json()`](https://developer.mozilla.org/en-US/docs/Web/API/Response/json) method that returns a `Promise`. 
We now have a sequence of several Promises:
1. The `Promise` returned by `fetch`
2. The `Promise` returned by `.json()`
The `.then()` method of `Promise`s has one more feature that lets us avoid Callback Heck: We can return a `Promise` from the callback passed to `.then()`.
We've labeled each `Promise` in the code below.
```typescript
fetch('https://people.cs.umass.edu/~joydeepb/yelp-tiny.json')  // PromiseA returned by fetch
    .then(response => {  // PromiseA *resolves* to a response, that result is passed to the callback
        return response.json();  // PromiseB from .json(), returned by the callback
    })
    .then(data => {  // PromiseB resolves to the JSON data, that data passed to the callback
        console.log(data);  // No return statement, implicitly returns Promise<void>
    });
```
```json
> tsc && node out/main.js

[
  {
    name: 'China Garden',
    city: 'Stanley',
    state: 'NC',
    stars: 3,
    review_count: 3,
    attributes: {
      RestaurantsAttire: 'casual',
      Alcohol: 'none',
      OutdoorSeating: false
    },
    categories: [ 'Chinese', 'Restaurants' ]
  },
  {
    name: 'Enterprise Rent-A-Car',
    city: 'Mesa',
    state: 'AZ',
    stars: 4,
    review_count: 3,
    attributes: {},
    categories: [ 'Hotels & Travel', 'Car Rental' ]
  }
]
```
To summarize, `.then()` is a method of `Promise` that takes in a callback function.
That callback function takes in the value provided when the `Promise` **resolves**.
The callback function then returns another `Promise`.
That promise is then passed to the callback of the next call to `.then()`, letting us "chain together" `Promises` in sequence.

### Promise States
A promise can be in one of three possible states:
1. **Pending**: The background task has been started, but a value is not yet available.
2. **Fulfilled**: The task has completed successfully, and the `Promise` can **resolve** to a value.
3. **Rejected**: The task failed. In this case, the `Promise` reports an error. This is analogous to throwing an exception.

So far we've only seen how to handle a `Promise` that has been successfully fulfilled.
How do we handle rejected `Promise`s?

There are two equivalent ways of doing this. 
1. Pass a second callback to `.then()`. The first callback is called if the promise is fulfilled. The second is called if the promise is rejected.
2. Pass the "fulfilled" callback to `.then()`, and pass the "error" callback to `.catch()`

The code examples below show these variations in the context of asynchronously reading the contents of a file from the filesystem.
The contents of the file `spam.txt` in the examples below are:
```
spam
egg
sausage
spam
```

1. Pass two callbacks to `.then()`
    a. The file exists (fulfilled)
    ```typescript
    import { readFile } from 'fs/promises';
    readFile('spam.txt', {encoding: 'utf-8'})
        .then(
            (data) => { 
                console.log(data);
            },
            (error) => {
                console.log("I am error");
                console.log(error);
            }
        );
    ```
    ```
    > tsc && node out/main.js

    spam
    egg
    sausage
    spam
    ```
    b. The file does not exist (rejected)
    ```typescript
    readFile('not_a_file.txt', {encoding: 'utf-8'})
        .then(
            (data) => { 
                console.log(data);
            },
            (error) => {
                console.log("I am error");
                console.log(error);
            }
        );
    ```
    ```
    > tsc && node out/main.js

    I am error
    Error: ENOENT: no such file or directory, open 'not_a_file.txt'
        at async open (node:internal/fs/promises:641:25)
        at async readFile (node:internal/fs/promises:1245:14) {
      errno: -2,
      code: 'ENOENT',
      syscall: 'open',
      path: 'not_a_file.txt'
    }
    ```
2. Pass the "fulfilled" callback to `.then()` and the "rejected" callback to `.catch()`
    ```typescript
    readFile('spam.txt', {encoding: 'utf-8'})
        .then((data) => { 
            console.log(data);
        })
        .catch((error) => {
            console.log("I am error");
            console.log(error);
        });
    ```
    ```
    > tsc && node out/main.js

    spam
    egg
    sausage
    spam
    ```
    ```typescript
    readFile('not_a_file.txt', {encoding: 'utf-8'})
        .then((data) => { 
            console.log(data);
        })
        .catch((error) => {
            console.log("I am error");
            console.log(error);
        });
    ```
    ```
    > tsc && node out/main.js

    I am error
    Error: ENOENT: no such file or directory, open 'not_a_file.txt'
        at async open (node:internal/fs/promises:641:25)
        at async readFile (node:internal/fs/promises:1245:14) {
      errno: -2,
      code: 'ENOENT',
      syscall: 'open',
      path: 'not_a_file.txt'
    }
    ```

### Waiting for Multiple Promises to Resolve
Sometimes we might need to wait until multiple promises have resolved before taking an action.
For example, say we need to read the contents of two files and return a sorted array of each line from the file.

A sub-optimal approach would be to read the first file, then when that `Promise` resolves read the second file. <br>
**Exercise:** Write code that reads and prints the contents of `spam.txt`, then reads and prints the contents of `waluigi.txt`.
The contents of `waluigi.txt` are:
```
waaaaa
luigi
time!
```

This makes us miss out on one of the main advantages of asynchronous programming, which is running background tasks in **parallel**.
In the code below, the contents of both files start to be read as soon as each call to `readFile` (which returns a `Promise`) finishes.
```typescript
// Start reading from 'spam.txt' in the background
let spam_file_promise = readFile('spam.txt', {encoding: 'utf-8'});
// Start reading from 'waluigi.txt' in the background
let waluigi_file_promise = readFile('waluigi.txt', {encoding: 'utf-8'});

// Wait until both promises have resolved successfully.
Promise.all(
    [spam_file_promise, waluigi_file_promise]
).then((content_arr) => {  // callback takes in an array of values, one for each promise
    const lines: string[] = content_arr.flatMap((content) => content.split("\n"));
    for (const line of lines.sort()) {
        if (line !== "") {
            console.log(line);
        }
    }
});  // We could also add a .catch() handler in case one of the files doesn't exist
```
```
egg
luigi
sausage
spam
spam
time!
waaaaa
```
