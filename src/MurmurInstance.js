const {
  murmurHash32,
  murmurHash64,
  murmurHash128
} = require('murmurhash-native');

function readUInt64BE(x, offset = 0) {
  /// this could affect ND of the hash function, needs research.
  const n=x.readUInt32BE(offset) *0x100000000 + x.readUInt32BE(offset +4);


  if(getBitsNeeded(n)!=64){
    throw new Error("wrong settings 10,murmuristance")
  }
  return n;

}
function readUInt128BE(x, offset = 0) {
  // sitll not tested .....
  // wrote it fast, not sure if this is accurate ? ?
  // buggy shit.
  exit();
  return x.readUInt32BE(offset) * 0x100000000**2 + x.readUInt32BE(offset + 4)* 0x100000000 +
    x.readUInt32BE(offset + 8);
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

  constructor(size) {
    this.size = size;
    //on size we choose the hash function.
    // Based on my understanding hash function should generate numbers
    //larger or equal to the bitarray size to mantain normal distribution.
    //not sure about the above statement still have not made my research.
    this.hashSize = getBitsNeeded(this.size);
    console.log(this.hashSize,111);
  }
  generateHash(key, seed) {
    switch (this.hashSize) {
      case 32:
        return this._handle32HashFunction(key,seed)
      case 64:
        return this._handle64HashFunction(key,seed);
        break;
      default:
        return  this._handle128HashFunction(key,seed);

    }
  }
  _handle128HashFunction(key, seed){

    return readUInt128BE(murmurHash64(key, seed, 'buffer'), 0)%this.size;
  }
  _handle64HashFunction(key, seed) {
    return readUInt64BE(murmurHash64(key, seed, 'buffer'), 0)%this.size;

  }
  _handle32HashFunction(key, seed) {
    const n=murmurHash32(key, seed, 'number');
    return n%this.size;
  }

}

module.exports = MurmurInstance;
