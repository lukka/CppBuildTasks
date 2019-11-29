// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as ma from 'azure-pipelines-task-lib/mock-answer';
import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';
import * as vcpkgUtilsMock from './vcpkg-utils-mock';
import * as assert from 'assert';

import * as Globals from '../../lib-vcpkg/src/globals'

const taskPath = path.join(__dirname, '..', 'src', 'vcpkg-task.js');
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

const pathToVcpkg = '/path/to/vcpkg';
const gitPath = '/usr/local/bin/git';

const answers: ma.TaskLibAnswers = {
  'which': {
    'git': '/usr/local/bin/git', 'sh': '/bin/bash', 'chmod': '/bin/chmod'
  },
  'checkPath': {
    '/usr/local/bin/git': true, '/bin/bash': true, '/bin/chmod': true
  },
  'exec': {
    [`/bin/chmod +x ${pathToVcpkg}/vcpkg`]: { 'code': 0, 'stdout': 'chmod output here' },
    [gitPath]: { 'code': 0, 'stdout': 'git output here' },
    [`${gitPath} clone https://github.com/microsoft/vcpkg.git -n .`]:
      { 'code': 0, 'stdout': 'this is git clone ... output' },
    [`${gitPath} submodule`]:
      { 'code': 0, 'stdout': 'this is git submodule output' },
    [`${gitPath} checkout --force newgitref`]:
      { 'code': 0, 'stdout': 'this is git checkout newgitref output' },
    [`${pathToVcpkg}/vcpkg install --recurse vcpkg_args --triplet triplet`]:
      { 'code': 0, 'stdout': 'this is the vcpkg output' },
    [`${pathToVcpkg}/vcpkg remove --outdated --recurse`]:
      { 'code': 0, 'stdout': 'this is the vcpkg remove output' },
    [`/bin/bash -c ${pathToVcpkg}/bootstrap-vcpkg.sh`]:
      { 'code': 0, 'stdout': 'this is the bootstrap output of bootstrap-vcpkg' },
    [`/bin/chmod +x ${pathToVcpkg}/bootstrap-vcpkg.sh`]:
      { 'code': 0, 'stdout': 'this is the bootstrap output of chmod +x bootstrap' }
  },
  'rmRF': { [`${pathToVcpkg}`]: { success: true } }
} as ma.TaskLibAnswers;

// Arrange
vcpkgUtilsMock.utilsMock.readFile = (file: string) => {
  if (file == `${pathToVcpkg}/.artifactignore`) {
    return [true, "!.git\n"];
  }
  else if (file == `${pathToVcpkg}/${Globals.vcpkgRemoteUrlLastFileName}`) {
    return [true, "https://github.com/microsoft/vcpkg.gitmygitref"];
  }
  else
    throw `readFile called with unexpected file name: '${file}'.`;
};
vcpkgUtilsMock.utilsMock.isVcpkgSubmodule = () => {
  return false;
};
vcpkgUtilsMock.utilsMock.setEnvVar = (name: string, value: string) => {
  // Ensure VCPKG_ROOT and AZP_CACHING_CONTENT_FORMAT are set during test execution.
  assert.ok(name === vcpkgUtilsMock.utilsMock.vcpkgRootEnvName ||
    name === vcpkgUtilsMock.utilsMock.cachingFormatEnvName);

  // Ensure their values are the expected ones.
  if (name === vcpkgUtilsMock.utilsMock.cachingFormatEnvName) {
    assert.equal(value, "Files");
  }
  if (name === vcpkgUtilsMock.utilsMock.vcpkgRootEnvName) {
    assert.equal(value, pathToVcpkg);
  }
};
tmr.registerMock('./vcpkg-utils', vcpkgUtilsMock.utilsMock);

tmr.registerMock('strip-json-comments', {
  stripJsonComments(str: string): string {
    return str;
  }
});

tmr.setAnswers(answers);
tmr.setInput(Globals.vcpkgArguments, 'vcpkg_args');
tmr.setInput(Globals.vcpkgTriplet, 'triplet');
tmr.setInput(Globals.vcpkgCommitId, 'newgitref');

// Act
tmr.run();

// Assert
