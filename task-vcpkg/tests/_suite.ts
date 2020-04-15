// Copyright (c) 2019-2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as assert from 'assert';
import * as ttm from 'azure-pipelines-task-lib/mock-test';
import * as path from 'path';
import * as utils from './test-utils';

function outputStdout(messages: string): void {
  process.env.TASK_TEST_TRACE && console.debug('STDOUT:\n' + messages);
}

describe('vcpkg task tests', function () {
  const basePath = '../../build-tasks/task-vcpkg/tests/';
  // Set the test timeout to 10 seconds
  this.timeout(10000);

  beforeEach(function () {
    // Clear the effect of all setInput()s before starting each test
    utils.clearInputs();
    this.timeout(1000);
  });
  before((done) => {
    // Init here.
    done();
  });

  after(() => {
    // Nothing to do.
  });

  it('vcpkg with simple inputs must succeed', (done: MochaDone) => {
    utils.runTest(done, (done) => {
      let tr: ttm.MockTestRunner | undefined;
      try {
        const tp =
          path.join(__dirname, basePath, 'success-vcpkg-basic.js');
        tr = new ttm.MockTestRunner(tp);
        tr.run();
      }
      finally {
        if (tr) {
          outputStdout(tr.stdout);
          assert.equal(tr.succeeded, true, 'must have succeeded');
          assert.equal(tr.warningIssues.length, 0, 'must have no warnings');
          assert.equal(tr.errorIssues.length, 0, 'must have no errors');
          assert.ok(tr.stdout.indexOf(" --triplet triplet") != -1, "Stdout must contain the triplet argument passed to vcpkg");
        }
        else {
          assert.fail("MockTestRunner not created!");
        }

      }
    });
  });

  it('vcpkg must build if not yet', (done: MochaDone) => {
    utils.runTest(done, (done) => {
      const tp =
        path.join(__dirname, basePath, 'success-vcpkg-build.js');
      const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
      tr.run();
      outputStdout(tr.stdout);
      assert.equal(tr.succeeded, true, 'must have succeeded');
      assert.equal(tr.warningIssues.length, 0, 'must have no warnings');
      assert.equal(tr.errorIssues.length, 0, 'must have no errors');
      tr.stdOutContained("this is the output of bootstrap-vcpkg");
    });
  });

  it('vcpkg must not build if already built', (done: MochaDone) => {
    utils.runTest(done, (done) => {
      const tp =
        path.join(__dirname, basePath, 'success-vcpkg-nobuild.js');
      const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
      tr.run();
      outputStdout(tr.stdout);
      assert.equal(tr.succeeded, true, 'must have succeeded');
      assert.equal(tr.warningIssues.length, 0, 'must have no warnings');
      assert.equal(tr.errorIssues.length, 0, 'must have no errors');
      assert.ok(tr.stdout.indexOf("this is the output of bootstrap-vcpkg") == -1);
    });
  });

  it('vcpkg with no triplet must succeed', (done: MochaDone) => {
    utils.runTest(done, (done) => {
      const tp =
        path.join(__dirname, basePath, 'success-vcpkg-notriplet.js');
      const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
      tr.run();
      outputStdout(tr.stdout);
      assert.equal(tr.succeeded, true, 'must have succeeded');
      assert.equal(tr.warningIssues.length, 0, 'must have no warnings');
      assert.equal(tr.errorIssues.length, 0, 'must have no errors');
      assert.ok(tr.stdout.indexOf("No '--triplet'"), "Stdout must contain the message about no triplet being provided.");
      assert.ok(tr.stdout.indexOf(" --triplet ") == -1, "Stdout must not contain any ' --triplet ' string.");
    });
  });

  it('vcpkg as submodule must not run git clone/pull commands', (done: MochaDone) => {
    utils.runTest(done, (done) => {
      const tp =
        path.join(__dirname, basePath, 'success-vcpkg-submodule.js');
      const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
      tr.run();
      outputStdout(tr.stdout);
      assert.equal(tr.succeeded, true, 'must have succeeded');
      assert.equal(tr.warningIssues.length, 0, 'must have no warnings');
      assert.equal(tr.errorIssues.length, 0, 'must have no errors');
      assert.ok(tr.stdout.indexOf("No '--triplet'"), "Stdout must contain the message about no triplet being provided.");
      assert.ok(tr.stdout.indexOf(" --triplet ") == -1, "Stdout must not contain any ' --triplet ' string.");
      assert.ok(tr.stdout.indexOf(' as a submodule') != -1, "vcpkg must be detected as submodule");
      assert.ok(tr.stdout.indexOf('!.git') == -1, "when vcpkg is a submodule, the '.git' directory must not be copied.");
      assert.ok(tr.stdout.indexOf(`\n.git'`) != -1, "when vcpkg is a submodule, the '.git' directory must not be copied.");
    });
  });

  it('vcpkg must bootstrap if source version is different than executable', (done: MochaDone) => {
    utils.runTest(done, (done) => {
      const tp =
        path.join(__dirname, basePath, 'success-vcpkg-bootstrap-on-version.js');
      const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
      tr.run();
      outputStdout(tr.stdout);
      assert.equal(tr.succeeded, true, 'must have succeeded');
      assert.equal(tr.warningIssues.length, 0, 'must have no warnings');
      assert.equal(tr.errorIssues.length, 0, 'must have no errors');
      assert.ok(tr.stdout.indexOf("No '--triplet'"), "Stdout must contain the message about no triplet being provided.");
      assert.equal(tr.stdout.indexOf(" --triplet "), -1, "Stdout must not contain any ' --triplet ' string.");
      assert.notEqual(tr.stdout.indexOf(' as a submodule'), -1, "vcpkg must be detected as submodule");
      assert.notEqual(tr.stdout.indexOf('this is the output of bootstrap-vcpkg'), -1, "stdout must contain 'this is the output of bootstrap-vcpkg'.");
    });
  });

  it('vcpkg must not bootstrap if source version matches the executable', (done: MochaDone) => {
    utils.runTest(done, (done) => {
      const tp =
        path.join(__dirname, basePath, 'success-vcpkg-donot-bootstrap-on-version.js');
      const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
      tr.run();
      outputStdout(tr.stdout);
      assert.equal(tr.succeeded, true, 'must have succeeded');
      assert.equal(tr.warningIssues.length, 0, 'must have no warnings');
      assert.equal(tr.errorIssues.length, 0, 'must have no errors');
      assert.ok(tr.stdout.indexOf("No '--triplet'"), "Stdout must contain the message about no triplet being provided.");
      assert.equal(tr.stdout.indexOf(" --triplet "), -1, "Stdout must not contain any ' --triplet ' string.");
      assert.notEqual(tr.stdout.indexOf(' as a submodule'), -1, "vcpkg must be detected as submodule");
      assert.notEqual(tr.stdout.indexOf('vcpkg executable is up to date with sources.'), -1, "vcpkg executable must be up to date with sources");
    });
  });

  it('vcpkg should handle overlays when running remove outdated command', (done: MochaDone) => {
    utils.runTest(done, (done) => {
      const tp =
        path.join(__dirname, basePath, 'success-vcpkg-overlays.js');
      const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
      tr.run();
      outputStdout(tr.stdout);
      assert.equal(tr.succeeded, true, 'must have succeeded');
      assert.equal(tr.warningIssues.length, 0, 'must have no warnings');
      assert.equal(tr.errorIssues.length, 0, 'must have no errors');
      assert.ok(tr.stdout.indexOf("--overlay-ports=lua --overlay-ports=../another/port") != -1, "Stdout must contain the overlays contained in the response file.");
    });
  });

});