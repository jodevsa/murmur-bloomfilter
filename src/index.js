"use strict";
const buffer = require('buffer');
const BitView = require('bitview');
const MurmurInstance = require('./MurmurInstance.js');
const fs = require('fs');
const util = require('util');
const openFile = util.promisify(fs.open);
const chunkSize = 32000;

const read = (fd, buffer, offset, length, position) => {
  return new Promise((resolve, reject) => {
    fs.read(fd, buffer, offset, length, position, (err, bytesRead, buffer) => {
      if (err) {
        return reject(err);
      } else {
        resolve(bytesRead);
      }

    })
  })

}
function calculateHashCount(size, n) {
  const m = size * 8;
  const k = Math.floor((m / n) * Math.log(2));
  return k;
};

function calculateSize(n, p) {
  const size = Math.floor(-(n * Math.log(p)) / (Math.log(2) ** 2));
  return Math.ceil(size / 8);
};

function loadK(b, k) {
  const view = new DataView(b);
  view.setUint8(0, k);
}
class BloomFilter {
  constructor(expectedItems, fp_prob) {
    this.offset = 4;

    if (typeof(expectedItems) === 'object') {
      this.size = (expectedItems.m) + this.offset;
      this.bitLength = expectedItems.m;
      this.k = expectedItems.k;
    } else {
      this.bitLength = calculateSize(expectedItems, fp_prob);
      this.size = this.bitLength + 4;
      this.k = calculateHashCount(this.size, expectedItems);

    }
    this._arraybuffer = new ArrayBuffer(Math.ceil(this.size / 8) + this.offset);
    this.bitLength = Math.ceil(this.size / 8) * 8;
    this.size = Math.ceil(this.size / 8);
    loadK(this._arraybuffer, this.k);
    this.bitView = new BitView(this._arraybuffer, this.offset);
    this.count = 0;

    this.byteLength = this._arraybuffer.byteLength;
    this.hashInstance = new MurmurInstance(this.size);
  }
  currentFPP() {
    return (1 - (1 - (1 / this.size)) ** (this.k * this.count)) ** this.k;
  }
  static from(path, cb) {
    return new Promise(async (resolve, reject) => {

      const fd = await openFile(path, 'r');
      const size = fs.statSync(path).size;

      const data = new ArrayBuffer(size);

      const total = size;
      let readOffset = 0;

      while ((total - readOffset) != 0) {
        if ((total - readOffset) >= chunkSize) {
          const view = new Uint8Array(data, readOffset, chunkSize);
          await read(fd, view, 0, chunkSize, readOffset);
          readOffset += chunkSize;
        } else {
          const length = total - readOffset;
          const view = new Uint8Array(data, readOffset, length);

          readOffset += (await read(fd, view, 0, length, readOffset))
        }

      }
      const filter = new BloomFilter({m: 1, k: 0});
      filter._arraybuffer = data;
      filter.bitView = new BitView(filter._arraybuffer, filter.offset);
      const view = new Uint8Array(data, 0, 1);
      filter.k = view[0];
      filter.size = (size + 4) * 8;
      filter.size = size - 4;
      filter.bitLength = (size - 4) * 8;
      ///
      resolve(filter)

    });
  }
  serialize(path, cb) {
    /// refactor in future.
    const stream = fs.createWriteStream(path, {flags: 'w'});
    let counter = 0;
    let answer = true;
    const data = this._arraybuffer;
    const total = data.byteLength;
    let done = 0;
    stream.once('open', () => {
      answer = true;
      while (answer) {
        if (done === total) {
          return;;
        }
        if ((total - done) >= chunkSize) {
          const buffer = new Uint8Array(data, done, chunkSize);
          answer = stream.write(buffer);
          done += chunkSize;
        } else {
          const buffer = new Uint8Array(data, done);
          answer = stream.write(buffer);
          done = total;
        }
      }
    });
    stream.on('close', () => {
      return cb();
    })
    stream.on('drain', () => {
      answer = true;
      while (answer) {
        if (done === total) {
          stream.destroy();
          return;
        }
        if ((total - done) >= chunkSize) {
          const buffer = new Uint8Array(data, done, chunkSize);
          answer = stream.write(buffer);
          done += chunkSize;
        } else {
          const buffer = new Uint8Array(data, done);
          answer = stream.write(buffer);
          done = total;
        }
      }
    });
  }
  add(key, cb) {
    this.count++;
    if (typeof(cb) === 'function') {
      return (async () => {
        for (let i = 0; i < this.k; i++) {
          const digest = (await this.hashInstance.generateHashAsync(key, i));
          this.bitView.set(digest % this.bitLength, 1);
        }
        return cb(true);
      })();
    } else {
      for (let i = 0; i < this.k; i++) {
        const digest = this.hashInstance.generateHash(key, i);
        this.bitView.set(digest % this.bitLength, 1);
      }
      return true;
    }
  }
  testAsync(key) {
    return new Promise((resolve) => {
      this.test(key, (answer) => {

        resolve(answer);
      })
    });
  }
  async addAsync(key) {
    for (let i = 0; i < this.k; i++) {

      const digest = (await this.hashInstance.generateHashAsync(key, i));
      this.bitView.set(digest + this.offset, true);
    }
    return true;
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

      const digest = this.hashInstance.generateHash(key, i);
      if (!this.bitView.get(digest % this.bitLength)) {
        return false;
      }
    }
    return true;

  }
  async _testAsync(key, cb) {

    for (let i = 0; i < this.k; i++) {

      const digest = (await this.hashInstance.generateHash(key, i));
      if (!this.bitView.get(digest + this.offset)) {
        cb(false);
      }
    }
    cb(true);

  }

}

module.exports = BloomFilter;
