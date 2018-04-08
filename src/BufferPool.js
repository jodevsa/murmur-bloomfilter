class BufferPool {

  constructor(size) {

    this.size = size;
    this.available = [];
    this.busy = [];

    for (let i = 0; i < size; i++) {
      this.available.push(new Buffer(10));
    }

  }

  use() {
    if (this.available.length != 0) {
      const buffer = this.available.pop();
      this.busy.push(buffer);

      return {
        free: () => {
          // remove from busy array.
          // slow and not needed ? lets see in the future .
          // why maintain a busy array ??!
          this.busy = this.busy.filter(function(item) {
            return item !== buffer;
          })
          //add to available array.
          this.available.push(buffer);
          
        },
        buffer
      };
    } else {
      return {
        free: () => {
          return;
        },
        buffer: new Buffer(10)
      };
    }

  }

}

module.exports = BufferPool;
