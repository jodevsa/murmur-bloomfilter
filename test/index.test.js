"use strict";

const BloomFilter=require("../src/index.js");
const os = require('os');
const fs = require('fs');

test('it should answer false for a random key', () => {
  const filter=new BloomFilter(1024,0.01);
  const word='male';
  filter.add(word);
  expect(filter.test('woot')).toBeFalsy();
  expect(filter.test(word)).toBeTruthy();
});
test('it should answer true for an added key', () => {
  const filter=new BloomFilter(1024,0.01);
  const word='male';
  filter.add(word);
  expect(filter.test(word)).toBeTruthy();
});
test('it should answer true for all added keys',()=>{
  const items=['hello', 'world', 'i', 'lol', 'plz', 'hey', 'man', 'woot'];
  const filter=new BloomFilter(1024,0.0001);
  items.map(item=>filter.add(item));
  items.map(item=>expect(filter.test(item)).toBeTruthy());
  expect(filter.test("not in the array.")).toBeFalsy();
});
test('it should answer true after serializing.', ()=>{
  const items=['hello', 'world', 'i', 'lol', 'plz', 'hey', 'man', 'woot'];
  const filter=new BloomFilter(1024,0.0001);
  items.map(item=>filter.add(item));
  const location=os.tmpdir()+"/test.data"
  fs.writeFileSync(location);
  const newFilter=new BloomFilter(fs.readFileSync(location));
  items.map(item=>expect(newFilter.test(item)).toBeTruthy());
  fs.unlinkSync(location);
});
