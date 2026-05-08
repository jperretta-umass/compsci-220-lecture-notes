// Consider the Picknicker and Seagull class below.
// Design a system that supports the following behaviors:
// 1. Picknickers can eat a sandwich they brought from home
// 2. Picknickers can buy ice cream from the concession stand
// 3. If a picknicker sees one of their friends buy ice cream,
//    there's a 50% chance that they'll also buy ice cream.
// 4. Seagulls have an 80% of attacking a picknicker when the picknicker
//    buys ice cream.
// 5. Seaguls have a 40% of attacking a picknicker when the picknicker
//    when the picknicker eats a sandwich.
//
// Indicate your answer by drawing a diagram showing the relationship
// between entities.


class Picknicker {
}

class Seagull {
  swoop(target: Picknicker) {
    console.log("MINE! MINE! MINE!");
  }
}

// Returns true p% of the time.
function percent_roll(p: number) {
  return Math.random() <= p / 100;
}
