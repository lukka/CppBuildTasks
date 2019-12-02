// Copyright (c) 2019-2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as assert from 'assert';

export function clearInputs(): void {
  // clear any environment vars set by the previous run
  Object.keys(process.env)
    .filter(key => key.startsWith('INPUT_'))
    .forEach(key => delete process.env[key]);
}

export function runTest(done: MochaDone, testFunction: (done: MochaDone) => any): void {
  try {
    testFunction(done);
    done();
  } catch (error) {
    done(error);
    assert.fail(error);
  }
} 