// Copyright (c) 2019-2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as ma from 'azure-pipelines-task-lib/mock-answer';
import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';
import * as vcpkgUtilsMock from './vcpkg-utils-mock';

import * as globals from '../../libs/run-vcpkg-lib/src/vcpkg-globals'

const taskPath = path.join(__dirname, '..', 'src', 'vcpkg-task.js');
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

const gitPath = '/usr/local/bin/git';
const vcpkgRoot = '/path/to/vcpkg';
const getVcpkgExeName = function (): string { return vcpkgUtilsMock.utilsMock.isWin32() ? "vcpkg.exe" : "vcpkg" };
const vcpkgExeName = getVcpkgExeName();
const vcpkgExePath = path.join(vcpkgRoot, vcpkgExeName);

const answers: ma.TaskLibAnswers = {
  'which': {
    'git': '/usr/local/bin/git', 'sh': '/bin/bash', 'chmod': '/bin/chmod',
    [vcpkgExePath]: vcpkgExePath
  },
  'checkPath': {
    '/usr/local/bin/git': true, '/bin/bash': true, '/bin/chmod': true, [vcpkgExePath]: true
  },
  'exec': {
    ["/bin/chmod +x /path/to/vcpkg/vcpkg"]: { 'code': 0, 'stdout': 'chmod output here' },
    [gitPath]: { 'code': 0, 'stdout': 'git output here' },
    [`${gitPath} clone https://github.com/microsoft/vcpkg.git -n .`]:
      { 'code': 0, 'stdout': 'this is git clone ... output' },
    [`${gitPath} checkout --force SHA1`]:
      { 'code': 0, 'stdout': 'this is git checkout SHA1 output' },
    '/path/to/vcpkg/vcpkg install --recurse vcpkg_args':
      { 'code': 0, 'stdout': 'this is the vcpkg output' },
    '/path/to/vcpkg/vcpkg remove --outdated --recurse':
      { 'code': 0, 'stdout': 'this is the vcpkg remove output' },
    '/bin/bash -c /path/to/vcpkg/bootstrap-vcpkg.sh':
      { 'code': 0, 'stdout': 'this is the output of bootstrap-vcpkg' },
    '/bin/chmod +x /path/to/vcpkg/bootstrap-vcpkg.sh':
      { 'code': 0, 'stdout': 'this is the output of chmod +x bootstrap' },
    [`${gitPath} rev-parse HEAD`]:
      { 'code': 0, 'stdout': 'mygitref' },
  },
  'rmRF': { '/path/to/vcpkg': { success: true } }
} as ma.TaskLibAnswers;

// Arrange
vcpkgUtilsMock.utilsMock.readFile = (file: string): [boolean, string] => {
  if (file == "/path/to/vcpkg/.artifactignore") {
    return [true, "!.git\n"];
  }
  else if (file == `/path/to/vcpkg/${globals.vcpkgLastBuiltCommitId}`) {
    return [true, "mygitref"];
  }
  else
    throw `readFile called with unexpected file name: ${file}`;
}
vcpkgUtilsMock.utilsMock.isVcpkgSubmodule = (): boolean => {
  return false;
};
tmr.registerMock('./vcpkg-utils', vcpkgUtilsMock.utilsMock);

tmr.registerMock('strip-json-comments', {
  stripJsonComments(str: string): string {
    return str;
  }
});

tmr.setAnswers(answers);
tmr.setInput(globals.vcpkgArguments, 'vcpkg_args');
tmr.setInput(globals.vcpkgCommitId, 'SHA1');

// Act
tmr.run();

// Assert
// Asserts are in _suite.ts where this test case in invoked.