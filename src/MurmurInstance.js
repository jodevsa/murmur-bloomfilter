
const {murmurHash32, murmurHash64, murmurHash128} = require('murmurhash-native');
const {murmurHash32Async, murmurHash64Async, murmurHash128Async} = require('murmurhash-native/promisify')();
const BufferPool = require('./BufferPool');
const assert = require('assert');
function generateUInt64BE(x, offset = 0,bits) {
  /*
  NodeJS maximum safe Number is 2**53 -1, currently does not support reading
  from a 64 bit ArrayBufer, i had to read the buffer with techniques
  that compute modulo of  multiple part of the buffer based on modulo
  theorems, so that i can ensure all generated numbers are less than 53 bit.

  recourses:
  https://www.khanacademy.org/computing/computer-science/cryptography/modarithmetic/a/what-is-modular-arithmetic
  https://www.khanacademy.org/computing/computer-science/cryptography/modarithmetic/a/modular-multiplication
  https://www.khanacademy.org/computing/computer-science/cryptography/modarithmetic/a/modular-addition-and-subtraction
  */


const p1modulo=(
  //max of 16 bit
  (x.readUInt16BE(0) % bits)
  //max of  49 bit
  * (0x1000000000000 % bits))% bits;
const n =((p1modulo)
            //max of 48 bit
          + ((x.readUInt16BE(2) *0x100000000)% bits)
            //max of 32 bit
          + ((x.readUInt16BE(4) *0x10000 ) % bits)
            //max of 16 bit
          + (((x.readUInt16BE(6)) % bits)));

  assert.equal(n>0,true);
  return n % bits;
}
function readUInt128BE(x, offset = 0) {
  // sitll not tested .....
  // wrote it fast, not sure if this is accurate ? ?
  // buggy shit.
  exit();
  return x.readUInt32BE(offset) * 0x100000000 + x.readUInt32BE(offset + 4);
}

function getBitsNeeded(number) {
  const bitSize = number.toString(2).length;
  if (bitSize <= 32) {
    return 32;
  } else if (bitSize <= 64) {
    return 64;
  } else {
    return 128;
  }
}
class MurmurInstance {

  constructor(size, bufferPoolSize = 8) {
    this.size = size;
    this.bufferPoolSize = bufferPoolSize;
    this.usedBuffer = -1;
    //on size we choose the hash function.
    // Based on my understanding hash function should generate numbers
    //larger or equal to the bitarray size to mantain normal distribution.
    //not sure about the above statement still have not made my research.
    this.hashSize = getBitsNeeded(this.size);
    this._bpool = new BufferPool(bufferPoolSize);

  }

  generateHash(key, seed,bits) {
    switch (this.hashSize) {
      case 32:
        return this._handle32HashFunction(key, seed,bits);
      case 64:
        return this._handle64HashFunction(key, seed, bits);
        break;
      default:
        return this._handle128HashFunction(key, seed);

    }
  }
  generateHashAsync(key, seed) {
    return new Promise((resolve, reject) => {
      let hashFunction;
      switch (this.hashSize) {
        case 32:
          hashFunction = this._handle32HashFunction.bind(this)
          break;
        case 64:
          hashFunction = this._handle64HashFunction.bind(this);
          break;
        default:
          hashFunction = this._handle128HashFunction.bind(this);

      }
      hashFunction(key,seed,(number)=>{
        return resolve(number);
      })
    });
  }
  _handle128HashFunction(key, seed, cb) {

    assert.notEqual(typeof(cb), 'function');
    return readUInt128BE(murmurHash64(key, seed, 'buffer'), 0);
  }
  _handle64HashFunction(key, seed,bits) {

    const B = this._bpool.use();
    if (typeof(cb) != 'function') {
      murmurHash64(key, seed, B.buffer);
      const n = generateUInt64BE(B.buffer, 0,bits);
      B.free();
      return n;
    } else {
      murmurHash64BE(key, seed, B.buffer).then(() => {
        const n = readUInt64BE(B.buffer, 0);
        B.free();
        return n;
      });
    }
  }
  _handle32HashFunction(key, seed, bits) {
    const B = this._bpool.use();
    if (typeof(cb) != 'function') {
      murmurHash32(key, seed, B.buffer);
      const n = B.buffer.readUInt32BE();
      B.free();
      return n%bits;
    } else {
      murmurHash32(key, seed, B.buffer,(err,digest)=>{
        const n = B.buffer.readUInt32BE();
        B.free();

        cb(n)

      });
    }

  }

}

module.exports = MurmurInstance;
