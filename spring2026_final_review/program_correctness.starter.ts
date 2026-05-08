// Precondition: word is a non-empty array of characters
function isPalindrome(word: string[]) {
  let front = 0;
  let back = word.length - 1;
  let result = word[front] === word[back];
  front = front + 1;
  back = back - 1;
  // State the invariant. Use partial(index) to denote
  // whether the characters up to and including index in word
  // are the reverse of the characters from
  // word.length - index to the end of the word.
  // For example, partial(0) is true for the word "spams",
  // but partial(1) is false.
  //

  // Prove the correctness of the function.
  while (front < back) {
    //
    if (word[front] !== word[back]) {
      //
      result = false;
      //
    } else {
      //
    }

    //
    front = front + 1;
    //
    back = back - 1;
    //
  }

  //

  return result;
}

// Prove termination by defining a quantity and reasoning about how
// it changes each time through the loop.
