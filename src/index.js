"use strict";

const {murmurHash} = require('murmurhash-native');
const fs = require('fs');
function calculateHashCount(m, n) {
  const k = Math.floor((m / n) * Math.log(2));
  return k;
}
function calculateSize(n, p) {
  const size = Math.floor(-(n * Math.log(p)) / (Math.log(2) ** 2));
  return size;
}
function calculateFPP(m, k, n) {}
class BloomFilter {
  constructor(expectedItems, fp_prob) {
    this.offset = 4;
    if (Buffer.isBuffer(expectedItems)) {
      this.data = expectedItems;
      this.k = expectedItems.readUInt8(0);
      this.size = this.data.length - this.offset;
    } else {
      if (typeof(expectedItems) === 'object') {
        this.size = expectedItems.m;
        this.k = expectedItems.k;
      } else {
        this.size = calculateSize(expectedItems, fp_prob);
        this.k = calculateHashCount(this.size, expectedItems);
      }
      this.data = new Buffer(this.offset + this.size);
      this.data.writeUInt8(this.k, 0);
      this.count = 0;
    }
  }
  currentFPP() {
    return (1 - (1 - (1 / this.size)) ** (this.k * this.count)) ** this.k;
  }
  serialize() {
    return this.data;
  }
  add(key) {
    this.count++;
    for (let i = 0; i < this.k; i++) {
      const digest = murmurHash(key, i) % this.size;
      this.data[digest + this.offset] = true;
    }
  }
  test(key) {
    for (let i = 0; i < this.k; i++) {
      const digest = (murmurHash(key, i) % this.size);
      if (!this.data[digest + this.offset]) {
        return false;
      }
    }
    return true;
  }

}

module.exports=BloomFilter;
