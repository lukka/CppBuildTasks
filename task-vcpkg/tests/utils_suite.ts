import * as assert from 'assert';

import * as vcpkgutils from '../src/vcpkg-utils'

function readFile(path: string): [boolean, string] {
  if (path.indexOf("response_file_with_triplet.txt") !== -1) {
    return [true, "--dry-run\n --triplet\n triplet\n"];
  }
  else if (path.indexOf("response_file_only_with_triplet.txt") !== -1) {
    return [true, "--triplet\ntriplet\n"];
  }
  else
    return [true, " triplet \nis \nnot \nspecified\n"];
}

describe('vcpkg-utils tests', function () {
  it('testing triplet extraction from arguments', async () => {
    assert.strictEqual(vcpkgutils.extractTriplet("", readFile), null);
    assert.strictEqual(vcpkgutils.extractTriplet("--triplet triplet", readFile), "triplet");
    assert.strictEqual(vcpkgutils.extractTriplet("--dry-run --triplet triplet", readFile), "triplet");
    assert.strictEqual(vcpkgutils.extractTriplet("--dry-run --triplet tri-plet ", readFile), "tri-plet");
    assert.strictEqual(vcpkgutils.extractTriplet("--dry-run --triplet  tri-plet --dry-run", readFile), "tri-plet");
    assert.strictEqual(vcpkgutils.extractTriplet("--dry-run --triplet ", readFile), null);
    assert.strictEqual(vcpkgutils.extractTriplet("--dry-run @response_file_with_triplet.txt --triplet x", readFile), "triplet");
    assert.strictEqual(vcpkgutils.extractTriplet("--dry-run @response_file_with_no_triplet.txt --triplet x", readFile), "x");
    assert.strictEqual(vcpkgutils.extractTriplet("--dry-run @response_file_with_no_triplet.txt ", readFile), null);
    assert.strictEqual(vcpkgutils.extractTriplet("--recursive @response_file_only_with_triplet.txt", readFile), "triplet");
  });
});
