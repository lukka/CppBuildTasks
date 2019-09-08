// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as assert from 'assert';
import * as ttm from 'azure-pipelines-task-lib/mock-test';
import * as path from 'path';
import * as utils from './test-utils';

function outputStdout(messages: string) {
  process.env.TASK_TEST_TRACE && console.debug('STDOUT:\n' + messages);
}

describe('vcpkg task tests', function () {
  beforeEach(function () {
    // Clear the effect of all setInput()s before starting each test
    utils.clearInputs();
    this.timeout(1000);
  });
  before((done) => {
    // Init here.
    done();
  });

  after(() => { });

  it('vcpkg with simple inputs should succeed', (done: MochaDone) => {
    utils.runTest(done, (done) => {
      let tp =
        path.join(__dirname, '../../build/task-vcpkg/tests/', 'success-vcpkg-basic.js');
      let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
      tr.run();
      outputStdout(tr.stdout);
      assert.equal(tr.succeeded, true, 'should have succeeded');
      assert.equal(tr.warningIssues.length, 0, 'should have no warnings');
      assert.equal(tr.errorIssues.length, 0, 'should have no errors');
      assert.ok(tr.stdout.indexOf(" --triplet triplet") != -1, "Stdout must contain the triplet argument passed to vcpkg")
    });
  });

  it('vcpkg should build if not yet', (done: MochaDone) => {
    utils.runTest(done, (done) => {
      let tp =
        path.join(__dirname, '../../build/task-vcpkg/tests/', 'success-vcpkg-build.js');
      let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
      tr.run();
      outputStdout(tr.stdout);
      assert.equal(tr.succeeded, true, 'should have succeeded');
      assert.equal(tr.warningIssues.length, 0, 'should have no warnings');
      assert.equal(tr.errorIssues.length, 0, 'should have no errors');
      tr.stdOutContained("this is the bootstrap output of vcpkg");
    });
  });

  it('vcpkg should not build if already built', (done: MochaDone) => {
    utils.runTest(done, (done) => {
      let tp =
        path.join(__dirname, '../../build/task-vcpkg/tests/', 'success-vcpkg-nobuild.js');
      let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
      tr.run();
      outputStdout(tr.stdout);
      assert.equal(tr.succeeded, true, 'should have succeeded');
      assert.equal(tr.warningIssues.length, 0, 'should have no warnings');
      assert.equal(tr.errorIssues.length, 0, 'should have no errors');
      assert.ok(tr.stdout.indexOf("this is the bootstrap output of vcpkg") == -1);
    });
  });

  it('vcpkg with no triplet should succeed', (done: MochaDone) => {
    utils.runTest(done, (done) => {
      let tp =
        path.join(__dirname, '../../build/task-vcpkg/tests/', 'success-vcpkg-notriplet.js');
      let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
      tr.run();
      outputStdout(tr.stdout);
      assert.equal(tr.succeeded, true, 'should have succeeded');
      assert.equal(tr.warningIssues.length, 0, 'should have no warnings');
      assert.equal(tr.errorIssues.length, 0, 'should have no errors');
      assert.ok(tr.stdout.indexOf("No '--triplet'"), "Stdout should contain the message about no triplet being provided.");
      assert.ok(tr.stdout.indexOf(" --triplet ") == -1, "Stdout must not contain any ' --triplet ' string.");
    });
  });

  it('vcpkg as submodule should not run git clone/pull commands', (done: MochaDone) => {
    utils.runTest(done, (done) => {
      let tp =
        path.join(__dirname, '../../build/task-vcpkg/tests/', 'success-vcpkg-submodule.js');
      let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
      tr.run();
      outputStdout(tr.stdout);
      assert.equal(tr.succeeded, true, 'should have succeeded');
      assert.equal(tr.warningIssues.length, 0, 'should have no warnings');
      assert.equal(tr.errorIssues.length, 0, 'should have no errors');
      assert.ok(tr.stdout.indexOf("No '--triplet'"), "Stdout should contain the message about no triplet being provided.");
      assert.ok(tr.stdout.indexOf(" --triplet ") == -1, "Stdout must not contain any ' --triplet ' string.");
      assert.ok(tr.stdout.indexOf(' as a submodule') != -1, "vcpkg must be detected as submodule");
      assert.ok(tr.stdout.indexOf('!.git') == -1, "when vcpkg is a submodule, the '.git' directory must not be copied.");
      assert.ok(tr.stdout.indexOf(`\n.git'`) != -1, "when vcpkg is a submodule, the '.git' directory must not be copied.");
    });
  });

});