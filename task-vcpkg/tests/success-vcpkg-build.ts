import * as ma from 'azure-pipelines-task-lib/mock-answer';
import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';
import * as vcpkgUtilsMock from './vcpkg-utils-mock';

import { Globals } from '../src/globals'

let taskPath = path.join(__dirname, '..', 'src', 'vcpkg-task.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

const gitPath: string = '/usr/local/bin/git';

let answers: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
  'which': { 'git': '/usr/local/bin/git', 'sh': '/bin/bash' },
  'checkPath': { '/usr/local/bin/git': true, '/bin/bash': true },
  'exec': {
    [gitPath]: { 'code': 0, 'stdout': 'git output here' },
    [`${gitPath} clone https://github.com/Microsoft/vcpkg.git -n .`]:
      { 'code': 0, 'stdout': 'this is git clone ... output' },
    [`${gitPath} checkout --force SHA1`]:
      { 'code': 0, 'stdout': 'this is git checkout SHA1 output' },
    '/path/to/vcpkg/vcpkg install --recurse vcpkg_args --triplet triplet':
      { 'code': 0, 'stdout': 'this is the vcpkg output' },
    '/path/to/vcpkg/vcpkg remove --outdated --recurse':
      { 'code': 0, 'stdout': 'this is the vcpkg remove output' },
    '/bin/bash -c /path/to/vcpkg/bootstrap-vcpkg.sh':
      { 'code': 0, 'stdout': 'this is the bootstrap output of vcpkg' }
  },
  'rmRF': { '/path/to/vcpkg': { success: true } },
  'writeFile':
    { 'vcpkg_remote_url.last': 'https://github.com/Microsoft/vcpkg.git' }
};

// Arrange
vcpkgUtilsMock.utilsMock.fileExists = (dir: string) => {
  // Report there is not executable 'vcpkg' on disk, this should request a build of vcpkg.
  if (path.parse(dir).base.indexOf('vcpkg') != 1) {
    return false;
  }
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
tmr.setInput(Globals.vcpkgTriplet, 'triplet');
tmr.setInput(Globals.vcpkgCommitId, 'SHA1');

// Act
tmr.run();

// Assert
