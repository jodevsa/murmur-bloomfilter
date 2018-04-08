"use strict";

const BloomFilter = require("../src/index.js");
const os = require('os');
const fs = require('fs');

test('it should answer false for a random key', () => {
  const filter = new BloomFilter(1024, 0.01);
  const word = 'male';
  filter.add(word);
  expect(filter.test('woot')).toBeFalsy();
  expect(filter.test(word)).toBeTruthy();
});
test('it should answer true for an added key', () => {
  const filter = new BloomFilter(1024, 0.01);
  const word = 'male';
  filter.add(word);
  expect(filter.test(word)).toBeTruthy();
});
test('it should answer true for all added keys', () => {
  const items = [
    'hello',
    'world',
    'i',
    'lol',
    'plz',
    'hey',
    'man',
    'woot'
  ];
  const filter = new BloomFilter(1024, 0.0001);
  items.map(item => filter.add(item));
  items.map(item => expect(filter.test(item)).toBeTruthy());
  expect(filter.test("not in the array.")).toBeFalsy();
});
test('it should answer be able to serialized', () => {
  const path = 'data.data';
  const items2 = ["it", 'works', 'omg!'];
  const items = [
    'hello',
    'world',
    'i',
    'lol',
    'plz',
    'hey',
    'man',
    'woot'
  ];
  const filter = new BloomFilter({m:20513876700,k:8});
  items.map(item => filter.add(item));
  filter.serialize(path, async () => {
    const filter2 = await BloomFilter.from(path);
    expect(filter2._arraybuffer.byteLength).toBe(filter.byteLength);
    expect(filter2.size).toBe(filter.size);
    expect(filter2.bitLength).toBe(filter.bitLength);
    items.map(item => expect(filter2.test(item)).toBeTruthy());
    items2.map(item => expect(filter2.test(item)).toBeFalsy());
  });
});
