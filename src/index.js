"use strict";
const buffer = require('buffer');
const BufferHack = require('./BufferHack');
const MurmurInstance = require('./MurmurInstance.js');
const fs = require('fs');
const v8 = require('v8');

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
  unserialize(path, cb) {
    const stream = fs.createReadStream(path);
    stream.on('readable', () => {
      //console.log(stream.read(1));
    })

  }
  serialize(path, cb) {
    /// refactor in future.
    const stream = fs.createWriteStream(path, {flags: 'a'});
    let counter = 0;
    let answer = true;
    const buffers = this.data.data;
    stream.once('open', () => {
      const k = new Buffer(1);
      k[0] = this.k;
      answer = stream.write(k);
      while (answer) {
        const buffer = buffers[counter];
        answer = stream.write(buffer);
        counter++;
      }
    });
    stream.on('drain', () => {
      if (counter === buffers.length) {
        return cb();
      }
      answer = true;
      while (answer) {
        const buffer = buffers[counter];
        answer = stream.write(buffer);
        counter++;
      }
    });
  }
  async add(key, cb) {
    this.count++;
    if (typeof(cb) === 'function') {
      for (let i = 0; i < this.k; i++) {
        const digest = (await this.hashInstance.generateHashAsync(key, i)) % this.size;
        this.data.change(digest + this.offset, true);
      }
      return cb();
    } else {
      for (let i = 0; i < this.k; i++) {
        const digest = this.hashInstance.generateHash(key, i) % this.size;
        ///    this.data[digest + this.offset] = true;
        this.data.change(digest + this.offset, true);
      }
    }
  }
  test(key, cb) {

    if (typeof(cb) != 'function') {
      return this._test(key, cb);
    } else {
      return this._testAsync(key, cb);
    }
  }
  _test(key, cb) {
    for (let i = 0; i < this.k; i++) {

      const digest = this.hashInstance.generateHash(key, i) % this.size;
      if (!this.data.get(digest + this.offset)) {
        return false;
      }
    }
    return true;

  }
  async _testAsync(key, cb) {

    for (let i = 0; i < this.k; i++) {

      const digest = (await this.hashInstance.generateHash(key, i)) % this.size;
      if (!this.data.get(digest + this.offset)) {
        cb(false);
      }
    }
    cb(true);

  }

}

module.exports = BloomFilter;
