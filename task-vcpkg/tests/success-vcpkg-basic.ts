// Copyright (c) 2019-2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as ma from 'azure-pipelines-task-lib/mock-answer';
import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';
import * as vcpkgUtilsMock from './vcpkg-utils-mock';
import * as assert from 'assert';

import * as globals from '../../libs/run-vcpkg-lib/src/vcpkg-globals'

const taskPath = path.join(__dirname, '..', 'src', 'vcpkg-task.js');
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

const gitPath = '/usr/local/bin/git';
const vcpkgRoot = '/path/to/vcpkg';
const getVcpkgExeName = function (): string { return vcpkgUtilsMock.utilsMock.isWin32() ? "vcpkg.exe" : "vcpkg" };
const vcpkgExeName = getVcpkgExeName();
const vcpkgExePath = path.join(vcpkgRoot, vcpkgExeName);
const vcpkgVersion = "1.2.3";

const envVarSetDict: { [name: string]: string } = {};

const answers: ma.TaskLibAnswers = {
  'which': {
    'git': '/usr/local/bin/git', 'sh': '/bin/bash', 'chmod': '/bin/chmod', 
    [vcpkgExePath]: vcpkgExePath
  },
  'checkPath': {
    '/usr/local/bin/git': true, '/bin/bash': true, '/bin/chmod': true, [vcpkgExePath]: true
  },
  'exec': {
    [`/bin/chmod +x ${path.join(vcpkgRoot, "vcpkg")}`]: { 'code': 0, 'stdout': 'chmod output here' },
    [`${vcpkgExePath} version`]: { 'code': 0, 'stdout': `"${vcpkgVersion}"` },
    [gitPath]: { 'code': 0, 'stdout': 'git output here' },
    [`${gitPath} clone https://github.com/microsoft/vcpkg.git -n .`]:
      { 'code': 0, 'stdout': 'this is git clone ... output' },
    [`${gitPath} submodule`]:
      { 'code': 0, 'stdout': 'this is git submodule output' },
    [`${gitPath} checkout --force newgitref`]:
      { 'code': 0, 'stdout': 'this is git checkout newgitref output' },
    [`${path.join(vcpkgRoot, "vcpkg")} install --recurse vcpkg_args --triplet triplet`]:
      { 'code': 0, 'stdout': 'this is the vcpkg output' },
    [`${vcpkgRoot}/vcpkg remove --outdated --recurse`]:
      { 'code': 0, 'stdout': 'this is the vcpkg remove output' },
    [`/bin/bash -c ${vcpkgRoot}/bootstrap-vcpkg.sh`]:
      { 'code': 0, 'stdout': 'this is the bootstrap output of bootstrap-vcpkg' },
    [`/bin/chmod +x ${vcpkgRoot}/bootstrap-vcpkg.sh`]:
      { 'code': 0, 'stdout': 'this is the bootstrap output of chmod +x bootstrap' }
  },
  'rmRF': { [`${vcpkgRoot}`]: { success: true } }
} as ma.TaskLibAnswers;

// Arrange
vcpkgUtilsMock.utilsMock.readFile = (file: string): [boolean, string] => {
  if (file == `${vcpkgRoot}/.artifactignore`) {
    return [true, "!.git\n"];
  }
  else if (file == `${vcpkgRoot}/${globals.vcpkgRemoteUrlLastFileName}`) {
    return [true, "https://github.com/microsoft/vcpkg.gitmygitref"];
  }
  else if (file.includes('VERSION.txt')) {
    return [true, `\"${vcpkgVersion}\"`];
  }
  else
    throw `readFile called with unexpected file name: '${file}'.`;
};
vcpkgUtilsMock.utilsMock.isVcpkgSubmodule = (): boolean => {
  return false;
};
vcpkgUtilsMock.utilsMock.setEnvVar = (name: string, value: string): void => {
  // Ensure they are not set twice.
  const existingValue: string = envVarSetDict[name];
  if (existingValue) {
    assert.fail(`Error: env var ${name} is set multiple times!`);
  }

  // Ensure their values are the expected ones.
  if (name === vcpkgUtilsMock.utilsMock.cachingFormatEnvName) {
    assert.equal(value, "Files");
  } else if (name === globals.outVcpkgRootPath) {
    assert.equal(value, vcpkgRoot);
  } else if (name === globals.outVcpkgTriplet) {
    // no check on value here...
  } else if (name === globals.vcpkgRoot) {
    // no check on value here...
  } else {
    assert.fail(`Unexpected variable name: '${name}'`);
  }
};
tmr.registerMock('./vcpkg-utils', vcpkgUtilsMock.utilsMock);

tmr.registerMock('strip-json-comments', {
  stripJsonComments(str: string): string {
    return str;
  }
});

tmr.setAnswers(answers);
tmr.setInput(globals.vcpkgArguments, 'vcpkg_args');
tmr.setInput(globals.vcpkgTriplet, 'triplet');
tmr.setInput(globals.vcpkgCommitId, 'newgitref');

// Act
tmr.run();

// Assert
// Asserts are in _suite.ts where this test case in invoked.