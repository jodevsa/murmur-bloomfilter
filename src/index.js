"use strict";
const buffer = require('buffer');
const BufferHack = require('./BufferHack');
const MurmurInstance = require('./MurmurInstance.js');
const fs = require('fs');

function calculateHashCount(size, n) {
  const m = size * 8;
  const k = Math.floor((m / n) * Math.log(2));
  return k;
};

function calculateSize(n, p) {
  const size = Math.floor(-(n * Math.log(p)) / (Math.log(2) ** 2));
  return Math.ceil(size / 8);
};
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
      this.data = new BufferHack(this.offset + this.size);
      //this.data.writeUInt8(this.k, 0);
      this.count = 0;
    }
    this.hashInstance = new MurmurInstance(this.size);
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
      const digest = this.hashInstance.generateHash(key, i) % this.size;
      ///    this.data[digest + this.offset] = true;
      this.data.change(digest + this.offset, true);
    }
  }
  test(key) {
    for (let i = 0; i < this.k; i++) {

      const digest = this.hashInstance.generateHash(key, i);
      if (!this.data.get(digest + this.offset)) {
        return false;
      }
    }
    return true;
  }

}

module.exports = BloomFilter;
