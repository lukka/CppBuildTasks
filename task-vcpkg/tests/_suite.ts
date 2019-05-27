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

});