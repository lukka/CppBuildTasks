// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as assert from 'assert';
import * as ttm from 'azure-pipelines-task-lib/mock-test';
import * as path from 'path';
import * as testutils from './test-utils';

/// Output all stdout if TASK_TEST_TRACE environment variable is set.
function outputStdout(messages: string) {
  process.env.TASK_TEST_TRACE && console.debug('STDOUT:\n' + messages);
}

describe('CMake task tests', function () {
  const basePath = '../../build/task-cmake/tests/';

  beforeEach(function () {
    // Clear the effect of all setInput()s before starting each test
    testutils.clearInputs();
    this.timeout(1000);
  });
  before((done) => {
    // Init here.
    done();
  });

  after(() => { });

  it('cmakelists.txt basic with simple inputs should succeed',
    (done: MochaDone) => {
      testutils.runTest(done, (done) => {
        const tp = path.join(__dirname, basePath, 'success-cmakelist-basic.js');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        outputStdout(tr.stdout);
        assert.equal(tr.succeeded, true, 'should have succeeded');
        assert.equal(tr.warningIssues.length, 0, 'should have no warnings');
        assert.equal(tr.errorIssues.length, 0, 'should have no errors');
        assert.equal(
          tr.stdout.indexOf('path') >= 0, true, 'should contain "path"');
        assert.equal(
          tr.stdout.indexOf('="ninjaPath') >= 0, true,
          'should contain "="ninjaPath"');
      });
    });

  it('cmakelists.txt basic with vcpkg toolchain should succeed',
    (done: MochaDone) => {
      testutils.runTest(done, (done) => {
        const tp = path.join(
          __dirname, basePath, 'success-cmakelist-basic-toolchain.js');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        outputStdout(tr.stdout);
        assert.equal(tr.succeeded, true, 'should have succeeded');
        assert.equal(tr.warningIssues.length, 0, 'should have no warnings');
        assert.equal(tr.errorIssues.length, 0, 'should have no errors');
        assert.equal(
          tr.stdout.indexOf('path') >= 0, true, 'should contain "path"');
        assert.equal(
          tr.stdout.indexOf('="/path/to/ninja') >= 0, true,
          'should contain ="ninjaPath');
        const toolchainString =
          '-DVCPKG_CHAINLOAD_TOOLCHAIN_FILE=/existing/tool/chain.cmake';
        assert.equal(
          tr.stdout.indexOf(toolchainString) >= 0, true,
          `should contain ${toolchainString}`);
      });
    });

  it('cmakelists.txt advanced with simple inputs should succeed',
    (done: MochaDone) => {
      testutils.runTest(done, (done) => {
        const tp =
          path.join(__dirname, basePath, 'success-cmakelist-advanced.js');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        outputStdout(tr.stdout);
        assert.equal(tr.succeeded, true, 'should have succeeded');
        assert.equal(tr.warningIssues.length, 0, 'should have no warnings');
        assert.equal(tr.errorIssues.length, 0, 'should have no errors');
        assert.equal(
          tr.stdout.indexOf('thePathTo') >= 0, true,
          'should contain "thePathTo"');
        assert.equal(
          tr.stdout.indexOf('\'/path/to/build/dir/\'') >= 0, true,
          'should contain \'/path/to/build/dir/\' ');
      });
    });

  it('cmakelists.txt advanced with vcpkg toolchain should succeed',
    (done: MochaDone) => {
      testutils.runTest(done, (done) => {
        const tp = path.join(
          __dirname, basePath, 'success-cmakelist-advanced-toolchain.js');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        outputStdout(tr.stdout);
        assert.equal(tr.succeeded, true, 'should have succeeded');
        assert.equal(tr.warningIssues.length, 0, 'should have no warnings');
        assert.equal(tr.errorIssues.length, 0, 'should have no errors');
        assert.equal(
          tr.stdout.indexOf('path') >= 0, true, 'should contain "path"');
        assert.equal(
          tr.stdout.indexOf('CMAKE_MAKE_PROGRAM=/usr/local/bin/ninja') >= 0, true,
          'should contain CMAKE_MAKE_PROGRAM=/usr/local/bin/ninja');
        const toolchainString =
          '-DVCPKG_CHAINLOAD_TOOLCHAIN_FILE=/existing/tool/chain.cmake';
        assert.equal(
          tr.stdout.indexOf(toolchainString) >= 0, true,
          `should contain ${toolchainString}`);
      });
    });

  it('cmakesettings.json with simple inputs should succeed',
    (done: MochaDone) => {
      testutils.runTest(done, (done) => {
        const tp = path.join(__dirname, basePath, 'success-cmakesettings.js');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        outputStdout(tr.stdout);
        assert.equal(tr.succeeded, true, 'should have succeeded');
        assert.equal(tr.warningIssues.length, 0, 'should have no warnings');
        assert.equal(tr.errorIssues.length, 0, 'should have no errors');
        assert.equal(
          tr.stdout.indexOf('anyName') >= 0, true,
          'should contain "anyName"');
        assert(
          tr.stdOutContained(`creating path: /agent/w/1/a/anyName`),
          'should have mkdirP destDir');

      });
    });

  it('cmakesettings.json with VS generators: provide proper -G -A values to cmake',
    (done: MochaDone) => {
      testutils.runTest(done, (done) => {
        const tp = path.join(__dirname, basePath, 'success-cmakesettings-vsgenerators.js');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        outputStdout(tr.stdout);
        assert.equal(tr.succeeded, true, 'should have succeeded');
        assert.equal(tr.warningIssues.length, 0, 'should have no warnings');
        assert.equal(tr.errorIssues.length, 0, 'should have no errors');
        assert.equal(
          tr.stdout.indexOf('anyName') >= 0, true,
          'should contain "anyName"');
      });
    });


  it('cmakesettings.json with BOM and comments should succeed',
    (done: MochaDone) => {
      testutils.runTest(done, (done) => {
        const tp = path.join(__dirname, basePath, 'success-cmakesettings-bom.js');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        outputStdout(tr.stdout);
        assert.equal(tr.succeeded, true, 'should have succeeded');
        assert.equal(tr.warningIssues.length, 0, 'should have no warnings');
        assert.equal(tr.errorIssues.length, 0, 'should have no errors');
        assert.equal(
          tr.stdout.indexOf('anyName') >= 0, true,
          'should contain "anyName"');
      });
    });

  it('cmakesettings.json with complex input should succeed',
    (done: MochaDone) => {
      testutils.runTest(done, (done) => {
        const tp =
          path.join(__dirname, basePath, 'success-cmakesettings-complex.js');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        outputStdout(tr.stdout);
        assert(tr.succeeded, 'should have succeeded');
        assert.equal(tr.warningIssues.length, 0, 'should have no warnings');
        assert.equal(tr.errorIssues.length, 0, 'should have no errors');
        assert(tr.stdOutContained('x86-Debug'), 'should contain "x86-Debug"');
        assert(
          tr.stdOutContained('-G "Visual Studio 16 2019"'),
          'should contain "-G "Visual Studio 16 2019"');
        assert(
          tr.stdOutContained('-A x64'),
          'should contain "-A x64');
        assert(
          tr.stdOutContained('-DCMAKE_BUILD_TYPE="Debug"'),
          'should contain configuration type Debug');
        // Check for the presence of one and only one toolchain passed only.
        const lines = tr.stdout.split("\n");
        for (const line of lines) {
          if (lines.indexOf("cmake arg:") != -1) {
            const toolchainName = "CMAKE_TOOLCHAIN_FILE";
            const firstOccurrence: number = lines.indexOf(toolchainName);
            assert(firstOccurrence != -1);
            // And only one
            assert(lines.indexOf("CMAKE_TOOLCHAIN_FILE", firstOccurrence + 1) == -1);
          }
        }
        assert(
          tr.stdOutContained(`creating path: /path/to/build/dir`),
          'should have mkdirP destDir');
      });
    });

  it('cmakesettings.json should not build if generate fails',
    (done: MochaDone) => {
      testutils.runTest(done, (done) => {
        const tp =
          path.join(__dirname, basePath, 'failure-cmakesettings-no-build.js');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        outputStdout(tr.stdout);
        assert(!tr.succeeded, 'should have failed');
        assert(tr.errorIssues.length > 0, 'should have errors');
        assert(tr.stdOutContained('x64-Release'), 'should contain "x64-Release"');
        assert(
          tr.stdOutContained('-DCMAKE_BUILD_TYPE="Release"'),
          'should contain configuration type Release');
        assert(
          tr.stdOutContained(`creating path: /path/to/build/dir/`),
          'should have mkdirP outputDir');
      });
    });

  it('cmakelists.txt advanced with no path to CMakeSettings.json should fail',
    (done: MochaDone) => {
      testutils.runTest(done, (done) => {
        const tp =
          path.join(__dirname, basePath, 'failure-cmakesettings-input.js');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        outputStdout(tr.stdout);
        assert.equal(tr.succeeded, false, 'should have failed');
        assert.equal(tr.warningIssues.length, 0, 'should have no warnings');
        assert.notEqual(tr.errorIssues.length, 0, 'should have errors');
      });
    });

  it('it should fail if no taskmode provided', (done: MochaDone) => {
    testutils.runTest(done, (done) => {
      const tp = path.join(__dirname, basePath, 'failure_no_task_mode.js');
      const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

      tr.run();
      outputStdout(tr.stdout);
      assert.equal(tr.succeeded, false, 'should have failed');
    });
  });

  it('it should fail if tool returns 1', (done: MochaDone) => {
    testutils.runTest(done, (done) => {
      this.timeout(1000);

      const tp = path.join(__dirname, basePath, 'failure-cmake-error-code.js');
      const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

      tr.run();
      outputStdout(tr.stdout);
      assert.equal(tr.succeeded, false, 'should have failed');
    });
  });
});