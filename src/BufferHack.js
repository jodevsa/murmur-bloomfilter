const buffer = require('buffer');

class BufferHack {
  constructor(size) {
    this._size = size;
    this._generateBufferArray(size);
  }
  _generateBufferArray(size) {
    this.data = [];
    const s = size / buffer.constants.MAX_LENGTH;
    let count = Math.ceil(s);
    while (count != 1) {
      this.data.push(new Buffer(buffer.constants.MAX_LENGTH));
      count--;
    }
    this.data.push(new Buffer(Math.ceil((s - Math.floor(s)) * buffer.constants.MAX_LENGTH)));
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


module.exports=BufferHack;
