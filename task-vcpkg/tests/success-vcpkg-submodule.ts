// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as ma from 'azure-pipelines-task-lib/mock-answer';
import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';
import * as vcpkgUtilsMock from './vcpkg-utils-mock';
import * as assert from 'assert';

import { Globals } from '../../lib-vcpkg/src/globals'

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
    [`${gitPath} submodule`]:
      { 'code': 0, 'stdout': 'this is git submodule output' },
    '/path/to/vcpkg/vcpkg install --recurse vcpkg_args':
      { 'code': 0, 'stdout': 'this is the vcpkg output' },
    '/path/to/vcpkg/vcpkg remove --outdated --recurse':
      { 'code': 0, 'stdout': 'this is the vcpkg remove output' },
    '/bin/bash -c /path/to/vcpkg/bootstrap-vcpkg.sh':
      { 'code': 0, 'stdout': 'this is the bootstrap output of vcpkg' },
    '/bin/chmod +x /path/to/vcpkg/bootstrap-vcpkg.sh':
      { 'code': 0, 'stdout': 'this is the bootstrap output of chmod +x bootstrap' }
  },
  'rmRF': { '/path/to/vcpkg': { success: true } }
};



// Arrange
vcpkgUtilsMock.utilsMock.readFile = (file: string) => {
  if (file == "/path/to/vcpkg/.artifactignore") {
    return [true, "tokeep1"];
  }
  else if (file == `/path/to/vcpkg/${Globals.vcpkgRemoteUrlLastFileName}`) {
    return [true, "https://github.com/microsoft/vcpkg.gitsamegitref"];
  }
  else
    throw `readFile called with unexpected file name: ${file}`;
};
vcpkgUtilsMock.utilsMock.writeFile = (file: string, content: string) => {
  console.log(`Writing to file '${file}' content '${content}'`);
  if (file.endsWith('.artifactignore')) {
    assert.ok(content.indexOf('!.git') === -1, "There must be no !.git .");
    const entries: string[] = [".git", "tokeep1", "tokeep2"];
    for (let entry of entries)
      assert.ok(content.indexOf(entry) !== -1, `There must be '${entry}' .`);
  }
};
vcpkgUtilsMock.utilsMock.isVcpkgSubmodule = () => {
  return true;
};
tmr.registerMock('./vcpkg-utils', vcpkgUtilsMock.utilsMock);

tmr.registerMock('strip-json-comments', {
  stripJsonComments(str: string): string {
    return str;
  }
});

tmr.setAnswers(answers);
tmr.setInput(Globals.vcpkgArguments, 'vcpkg_args');
tmr.setInput(Globals.vcpkgCommitId, 'samegitref');
tmr.setInput(Globals.vcpkgArtifactIgnoreEntries, 'tokeep2');

// Act
tmr.run();

// Assert
