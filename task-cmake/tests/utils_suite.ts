// Copyright (c) 2019-2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as assert from 'assert';
import * as utils from '../../libs/run-cmake-lib/src/utils'

describe('utils tests', function () {
  it('testing for presence of flags', async () => {
    assert.ok(utils.isNinjaGenerator(['-GNinja']));
    assert.ok(utils.isNinjaGenerator(['-G Ninja']));
    assert.ok(!utils.isNinjaGenerator(['-G ninja']));
    assert.ok(!utils.isNinjaGenerator(['-g Ninja']));
    assert.ok(!utils.isNinjaGenerator(['-Gninja']));
    assert.ok(utils.isNinjaGenerator(['-G"Ninja"']));
    assert.ok(utils.isNinjaGenerator(['-G Ninja"']));
    assert.ok(utils.isNinjaGenerator(['-G  Ninja"']));
    assert.ok(utils.isNinjaGenerator(['-G  "Ninja"']));
    assert.ok(!utils.isNinjaGenerator(['-G  "Ninja']));
    assert.ok(!utils.isNinjaGenerator(['-g"Ninja"']));
    assert.ok(!utils.isNinjaGenerator(['-gNinja']));
    assert.ok(!utils.isNinjaGenerator(['-g"Ninja']));

    assert.ok(utils.isMakeProgram(['-DCMAKE_MAKE_PROGRAM=']));
    assert.ok(!utils.isMakeProgram(['-D CMAKE_MAKE_PROGRAM=']));
    assert.ok(!utils.isMakeProgram(['-dCMAKE_MAKE_PROGRAM=']));
    assert.ok(!utils.isMakeProgram(['-d CMAKE_MAKE_PROGRAM=']));
    assert.ok(!utils.isMakeProgram(['']));
    assert.ok(!utils.isMakeProgram([' ']));

    assert.ok(utils.isToolchainFile(['-DCMAKE_TOOLCHAIN_FILE']));
    assert.ok(utils.isToolchainFile([' -DCMAKE_TOOLCHAIN_FILE']));
    assert.ok(!utils.isToolchainFile([' -dCMAKE_TOOLCHAIN_FILE']));

    assert.ok(utils.removeToolchainFile([' -DCMAKE_TOOLCHAIN_FILE=/path/to/file.cmake ']).length === 0);
    assert.ok(utils.removeToolchainFile([' -DCMAKE_TOOLCHAIN_FILE:FILEPATH=/path/to/file.cmake ']).length === 0);
    assert.ok(utils.removeToolchainFile([' -DCMAKE_TOOLCHAIN_FILE:FILE=/path/to/file.cmake ']).length === 0);
    assert.ok(utils.removeToolchainFile([' -DCMAKE_TOOLCHAIN_FILE:STRING="/path/to/file.cmake" ']).length === 0);
    assert.ok(utils.removeToolchainFile([' -DCMAKE_TOOLCHAIN_FILE="/path/to/file.cmake" ']).length === 0);
    assert.deepEqual(utils.removeToolchainFile(['-DVAR=NAME', '-DCMAKE_TOOLCHAIN_FILE=/path/to/file.cmake']), ['-DVAR=NAME']);
    assert.deepEqual(utils.removeToolchainFile(['-DVAR=NAME ', '-DCMAKE_TOOLCHAIN_FILE="/path/to/file.cmake"']), ['-DVAR=NAME ']);
    assert.deepEqual(utils.removeToolchainFile(['-DVAR=NAME ', ' -DCMAKE_TOOLCHAIN_FILE=c:\\path\\to\\file.cmake']), ['-DVAR=NAME ']);
    assert.ok(utils.isToolchainFile([' -DCMAKE_TOOLCHAIN_FILE=/path/to/file.cmake ']));
    assert.ok(!utils.isToolchainFile([' -DVAR=NAME ']));

    process.env.RUNVCPKG_VCPKG_ROOT = "/vcpkgroot/";
    let ret: string[] = await utils.injectVcpkgToolchain(['-DCMAKE_TOOLCHAIN_FILE=existing.cmake'], "triplet");
    assert.deepEqual(ret, ['-DCMAKE_TOOLCHAIN_FILE=/vcpkgroot/scripts/buildsystems/vcpkg.cmake', '-DVCPKG_CHAINLOAD_TOOLCHAIN_FILE=existing.cmake', '-DVCPKG_TARGET_TRIPLET=triplet']);
    ret = await utils.injectVcpkgToolchain(['-DCMAKE_TOOLCHAIN_FILE:FILEPATH=existing.cmake'], "triplet");
    assert.deepEqual(ret, ['-DCMAKE_TOOLCHAIN_FILE=/vcpkgroot/scripts/buildsystems/vcpkg.cmake', '-DVCPKG_CHAINLOAD_TOOLCHAIN_FILE=existing.cmake', '-DVCPKG_TARGET_TRIPLET=triplet']);
    ret = await utils.injectVcpkgToolchain(['-DCMAKE_BUILD_TYPE=Debug'], "triplet");
    assert.deepEqual(ret, ['-DCMAKE_BUILD_TYPE=Debug', '-DCMAKE_TOOLCHAIN_FILE=/vcpkgroot/scripts/buildsystems/vcpkg.cmake', '-DVCPKG_TARGET_TRIPLET=triplet']);

    process.env.RUNVCPKG_VCPKG_ROOT = "";
    const arg: string[] = [' -DCMAKE_BUILD_TYPE=Debug'];
    ret = await utils.injectVcpkgToolchain(arg, "triplet");
    assert.deepEqual(ret, arg);
  });

  it('testing for path normalization', async () => {
    assert.strictEqual(utils.normalizePath('/a/path/'), '/a/path');
    assert.strictEqual(utils.normalizePath('/a/../path/'), '/path');
    assert.strictEqual(utils.normalizePath('/'), '/');
    assert.strictEqual(utils.normalizePath('/a'), '/a');
    assert.strictEqual(utils.normalizePath('/a/'), '/a');
    assert.strictEqual(utils.normalizePath('/a/path'), '/a/path');
  });
});
