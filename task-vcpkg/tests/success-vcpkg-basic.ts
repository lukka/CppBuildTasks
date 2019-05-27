import * as ma from 'azure-pipelines-task-lib/mock-answer';
import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';

import { Globals } from '../src/globals'

let taskPath = path.join(__dirname, '..', 'src', 'vcpkg-task.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

const gitPath: string = '/usr/local/bin/git';

let answers: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
  'which': { 'git': '/usr/local/bin/git', 'sh': '/bin/bash' },
  'checkPath': { '/usr/local/bin/git': true, '/bin/bash': true },
  'exec': {
    [gitPath]: { 'code': 0, 'stdout': 'git output here' },
    [`${gitPath} init`]:
      { 'code': 0, 'stdout': 'this is git init output' },
    [`${gitPath} fetch https://github.com/Microsoft/vcpkg.git master`]:
      { 'code': 0, 'stdout': 'this is git fetch ... output' },
    [`${gitPath} checkout --force FETCH_HEAD`]:
      { 'code': 0, 'stdout': 'this is git checkout FETCH_HEAD output' },
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
tmr.registerMock('./vcpkg-utils', {
  getBinDir() {
    return '/path/to/';
  },
  throwIfErrorCode(code: Number) {
    if (code != 0) throw new Error('throwIfErrorCode throws');
    return 0;
  },
  isWin32(): boolean {
    return false;
  },
  directoryExists(dir: string) {
    return true;
  },
  readFile(file: string) {
    return [false, "https://github.com/Microsoft/vcpkg.git"];
  },
  getDefaultTriplet(): string {
    return "triplet";
  },
  fileExists(file: string) {
    return true;
  }
});

tmr.registerMock('strip-json-comments', {
  stripJsonComments(str: string): string {
    return str;
  }
});

tmr.setAnswers(answers);
tmr.setInput(Globals.vcpkgArguments, 'vcpkg_args');

// Act
tmr.run();

// Assert
