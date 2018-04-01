"use strict";
const buffer = require('buffer');
const {murmurHash128} = require('murmurhash-native');
const fs = require('fs');

function readUInt64BE(x, offset = 0) {
  return x.readUInt32BE(offset) * 10 ** 10 + x.readUInt32BE(offset + 8);

}
function calculateHashCount(size, n) {
  const m = size * 8;
  const k = Math.floor((m / n) * Math.log(2));
  return k;
}

function calculateSize(n, p) {
  const size = Math.floor(-(n * Math.log(p)) / (Math.log(2) ** 2));
  return Math.ceil(size / 8);
}
class BufferHack {
  constructor(size) {
    this._size = size;
    this._generateBufferArray(size);
  }
  _generateBufferArray(size) {
    this.data = [];
    const s = size / buffer.constants.MAX_LENGTH;
    let count = Math.ceil(s);
    console.log(count)
    while (count != 1) {
      this.data.push(new Buffer(buffer.constants.MAX_LENGTH));
      count--;
    }
    this.data.push(new Buffer(Math.ceil((s - Math.floor(s)) * buffer.constants.MAX_LENGTH)));
    console.log(this.data.length)
  }
  change(location, value) {
    if (location > this._size) {
      throw new Error("index out of range!")
    }
    const bufferArray = this.data;
    const totalSize = this._size;
    const s = location / buffer.constants.MAX_LENGTH;
    let count = Math.floor(s);
    let index = Math.ceil((s - count) * buffer.constants.MAX_LENGTH);

    this.data[count][index] = value;
  };
  get(location) {
    if (location > this._size) {
      throw new Error("index out of range!")
    }
    const bufferArray = this.data;
    const totalSize = this._size;
    const s = location / buffer.constants.MAX_LENGTH;
    let count = Math.floor(s);
    let index = Math.ceil((s - count) * buffer.constants.MAX_LENGTH);
    return this.data[count][index];
  };
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
      this.data = new BufferHack(this.offset + this.size);
      //this.data.writeUInt8(this.k, 0);
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
      const digest = readUInt64BE(murmurHash128(key, i, 'buffer'), 0) % this.size;

      ///    this.data[digest + this.offset] = true;
      this.data.change(digest + this.offset, true);
    }
  }
  test(key) {
    for (let i = 0; i < this.k; i++) {

      const digest = (readUInt64BE(murmurHash128(key, i, 'buffer'), 0) % this.size);
      if (!this.data.get(digest + this.offset)) {
        return false;
      }
    }
    return true;
  }

}

module.exports = BloomFilter;
