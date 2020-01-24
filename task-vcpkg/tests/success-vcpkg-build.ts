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
const vcpkgVersion = "1.2.3";

const answers: ma.TaskLibAnswers = {
  'which': {
    'git': '/usr/local/bin/git',
    'sh': '/bin/bash',
    'chmod': '/bin/chmod',
    [vcpkgExePath]: vcpkgExePath
  },
  'checkPath': {
    '/usr/local/bin/git': true,
    '/bin/bash': true,
    '/bin/chmod': true
  },
  'exec': {
    [gitPath]: { 'code': 0, 'stdout': 'git output here' },
    [`${gitPath} clone https://github.com/microsoft/vcpkg.git -n .`]:
      { 'code': 0, 'stdout': 'this is git clone ... output' },
    [`${gitPath} checkout --force SHA1`]:
      { 'code': 0, 'stdout': 'this is git checkout SHA1 output' },
    [`${path.join(vcpkgRoot, "vcpkg")} install --recurse vcpkg_args --triplet triplet`]:
      { 'code': 0, 'stdout': 'this is the vcpkg output' },
    [`${path.join(vcpkgRoot, "vcpkg")} remove --outdated --recurse`]:
      { 'code': 0, 'stdout': 'this is the vcpkg remove output' },
    [`/bin/bash -c ${path.join(vcpkgRoot, "bootstrap-vcpkg.sh")}`]:
      { 'code': 0, 'stdout': 'this is the bootstrap output of vcpkg' },
    [`/bin/chmod +x ${path.join(vcpkgRoot, "bootstrap-vcpkg.sh")}`]:
      { 'code': 0, 'stdout': 'this is the bootstrap output of chmod +x bootstrap' }
  },
  'rmRF': { [`${vcpkgRoot}`]: { success: true } }
} as ma.TaskLibAnswers;

// Arrange
vcpkgUtilsMock.utilsMock.fileExists = (dir: string): boolean => {
  // Report that there is not executable 'vcpkg' on disk, this should trigger a new build of vcpkg.
  if (path.parse(dir).base.indexOf('vcpkg') != 1) {
    return false;
  }
  return true;
};
vcpkgUtilsMock.utilsMock.readFile = (file: string): [boolean, string] => {
  if (file === path.join(vcpkgRoot, ".artifactignore")) {
    return [true, "!.git\n"];
  }
  else if (file === path.join(vcpkgRoot, globals.vcpkgRemoteUrlLastFileName)) {
    return [false, "https://github.com/microsoft/vcpkg.git"];
  }
  else if (file.includes('VERSION.txt')) {
    return [true, `\"${vcpkgVersion}\"`];
  }
  else
    throw `readFile called with unexpected file name: ${file}`;
}
vcpkgUtilsMock.utilsMock.isVcpkgSubmodule = (): boolean => {
  return false;
}
tmr.registerMock('./vcpkg-utils', vcpkgUtilsMock.utilsMock);

tmr.registerMock('strip-json-comments', {
  stripJsonComments(str: string): string {
    return str;
  }
});

tmr.setAnswers(answers);
tmr.setInput(globals.vcpkgArguments, 'vcpkg_args');
tmr.setInput(globals.vcpkgTriplet, 'triplet');
tmr.setInput(globals.vcpkgCommitId, 'SHA1');

// Act
tmr.run();

// Assert
// Asserts are in _suite.ts where this test case in invoked.