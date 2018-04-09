murmur-bloomfilter
===============================

It's a [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter), implemented using  murmur hash function.

A bloom filter has two methods: `add()` and `test()`. You
`add()` an element and voodoo happens; you
`test()` for an element and it returns `false` if the element is _definitely
not_ in the set, or `true` if the element is _probably_ in the set.

Installation
-----

`npm install murmur-bloomfilter --save`

Usage:

```javascript
var  BloomFilter = require("murmur-bloomfilter");

//Simple Usage: create a filter with  1000 expected item and 0.01 false positive probability.
/*
ie: if you are expecting to load 1000 items and you want to maintain a probability of not more than 0.01 false positives
*/
//Recomendded: it will calculate the best setup for your need.
var filter = new BloomFilter(1000, 0.01);

// Add some keys
filter.add("test")
filter.add("hey");

// Test them
console.log(filter.test("test")); // true
console.log(filter.test("man")); // false
console.log("false positive probability",filter.currentFPP())
console.log(filter.test("hey")); //true

/// advanced mode : use your own parameters for filter size and hash count (m,k)
var filter = new BloomFilter({m:1024,k:2});
filter.add("hey");
console.log(filter.test("hey")); // true

/// serialization interface:
var filter = new BloomFilter(1000, 0.01);
filter.add("hey");
filter.add("woot");

filter.serialize("bloom.data",()=>{
  const newFilter=BloomFilter.from("bloo.data").then(()=>{
    newFilter.test("hey")  //true
    newFilter.test("woot") //true
  });

});

```

Implementation
----------------------
Ported from [geeksforgeeks.org](https://www.geeksforgeeks.org/bloom-filters-introduction-and-python-implementation/) tutourial.
* the hashing part is [native](https://github.com/royaltm/node-murmurhash-native).
* The hashing function is [murmur](https://en.wikipedia.org/wiki/MurmurHash), because
  it's fast and well-tested.
* Buffer is always in its serialized form, makes serializing fast.
