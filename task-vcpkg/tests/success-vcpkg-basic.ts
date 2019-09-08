// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as ma from 'azure-pipelines-task-lib/mock-answer';
import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';
import * as vcpkgUtilsMock from './vcpkg-utils-mock';

import { Globals } from '../src/globals'

let taskPath = path.join(__dirname, '..', 'src', 'vcpkg-task.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

const gitPath: string = '/usr/local/bin/git';

let answers: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
  'which': {
    'git': '/usr/local/bin/git', 'sh': '/bin/bash', 'chmod': '/bin/chmod'
  },
  'checkPath': {
    '/usr/local/bin/git': true, '/bin/bash': true, '/bin/chmod': true
  },
  'exec': {
    ["/bin/chmod +x /path/to/vcpkg/vcpkg"]: { 'code': 0, 'stdout': 'chmod output here' },
    [gitPath]: { 'code': 0, 'stdout': 'git output here' },
    [`${gitPath} clone https://github.com/microsoft/vcpkg.git -n .`]:
      { 'code': 0, 'stdout': 'this is git clone ... output' },
    [`${gitPath} submodule`]:
      { 'code': 0, 'stdout': 'this is git submodule output' },
    [`${gitPath} checkout --force newgitref`]:
      { 'code': 0, 'stdout': 'this is git checkout newgitref output' },
    '/path/to/vcpkg/vcpkg install --recurse vcpkg_args --triplet triplet':
      { 'code': 0, 'stdout': 'this is the vcpkg output' },
    '/path/to/vcpkg/vcpkg remove --outdated --recurse':
      { 'code': 0, 'stdout': 'this is the vcpkg remove output' },
    '/bin/bash -c /path/to/vcpkg/bootstrap-vcpkg.sh':
      { 'code': 0, 'stdout': 'this is the bootstrap output of bootstrap-vcpkg' },
    '/bin/chmod +x /path/to/vcpkg/bootstrap-vcpkg.sh':
      { 'code': 0, 'stdout': 'this is the bootstrap output of chmod +x bootstrap' }

  },
  'rmRF': { '/path/to/vcpkg': { success: true } }
};

// Arrange
vcpkgUtilsMock.utilsMock.readFile = (file: string) => {
  if (file == "/path/to/vcpkg/.artifactignore") {
    return [true, "!.git\n"];
  }
  else if (file == `/path/to/vcpkg/${Globals.vcpkgRemoteUrlLastFileName}`) {
    return [true, "https://github.com/microsoft/vcpkg.gitmygitref"];
  }
  else
    throw `readFile called with unexpected file name: '${file}'.`;
};
vcpkgUtilsMock.utilsMock.isVcpkgSubmodule = () => {
  return false;
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
