import * as ma from 'azure-pipelines-task-lib/mock-answer';
import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';

import { Globals } from '../src/globals'

import * as utils from './test-utils'

let taskPath = path.join(__dirname, '..', 'src', 'cmake-task.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

// Arrange
let answers: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
  'which': { 'cmake': '/usr/local/bin/cmake', 'node': '/usr/local/bin/node' },
  'checkPath': { '/usr/local/bin/cmake': true, '/usr/local/bin/node': true },
  'exec': {
    '/usr/local/bin/cmake': { 'code': 0, 'stdout': 'cmake test output here' },
    '/usr/local/bin/cmake -G Unix Makefiles -DCMAKE_BUILD_TYPE=RelWithDebInfo .':
      { 'code': 0, 'stdout': 'this is the cmake output' },
    '/usr/local/bin/cmake --build . -- -cmake -build -args':
      { 'code': 0, 'stdout': 'cmake build output here' }
  },
  'mkdirP': { '/': { 'code': 0, 'stdout': 'mkdirP output' } }
};

class MockStats {
  mode = 600;
};
tmr.registerMock('fs', {
  writeFileSync: function (filePath, contents) { },
  existsSync: function (filePath, contents) {
    return true;
  },
  readFileSync: function (filePath) {
    return '\uFEFF{\
      //comment\n\
      "configurations": [{\
      "environments": [{ "envvar": "envvalue"}],\
        "name": "anyName",\
        // I love comments\n\
        "configurationType": "RelWithDebInfo",\
        "generator": "Unix Makefiles",\
        "buildRoot": "/build/root/${env.envvar}",\
        "buildCommandArgs": "-cmake -build -args"\
      }]\
    }';
  },
  statSync: function (filePath) {
    let s: MockStats = new MockStats();
    return s;
  },
  chmodSync: function (filePath: string) { }
});

tmr.registerMock('./utils', {
  getSourceDir: function (): string {
    return '/agent/w/1/s';
  },
  isWin32: function (): boolean {
    return true;
  },
  injectEnvVariables: function (a, b): void { },
  getArtifactsDir: function (): string { return '/agent/w/1/a'; },
  build: function (): void { },
  injectVcpkgToolchain: function (args: string, triplet: string): string { return args; },
  isNinjaGenerator: function (): boolean { return false; }
});

tmr.setAnswers(answers);
utils.clearInputs();
tmr.setInput(Globals.cmakeListsOrSettingsJson, 'CMakeSettingsJson');
tmr.setInput(Globals.cmakeSettingsJsonPath, 'anyCMakeSettings.json');
tmr.setInput(Globals.configurationRegexFilter, 'any.+');
tmr.setInput(Globals.buildWithCMake, 'true');
tmr.setInput(Globals.buildWithCMakeArgs, 'this must be unused');
process.env["BUILD_ARTIFACTSTAGINGDIRECTORY"] = "/agent/w/1/a/";

// Act
tmr.run();
