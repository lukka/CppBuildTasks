// Copyright (c) 2019-2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as ma from 'azure-pipelines-task-lib/mock-answer';
import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';
import * as utils from './test-utils'
import * as ifacelib from '../../libs/base-lib/src/base-lib';

import * as globals from '../../libs/run-cmake-lib/src/cmake-globals'

const taskPath = path.join(__dirname, '..', 'src', 'cmake-task.js');
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

const artifactStagingDirectory = "/agent/w/1/a";

// Arrange
const answers: ma.TaskLibAnswers = {
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
} as ma.TaskLibAnswers;

class MockStats {
  mode = 600;
};
tmr.registerMock('fs', {
  writeFileSync: function (filePath: string, contents: string) {
    // nothing to do
  },
  existsSync: function (filePath: string, contents: string) {
    return true;
  },
  readFileSync: function (filePath: string) {
    return '{\
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
  statSync: function (filePath: string) {
    const s: MockStats = new MockStats();
    return s;
  },
  chmodSync: function (filePath: string) {
    // Nothing to do.
  }
});

tmr.registerMock('./utils', {
  isWin32: function (): boolean {
    return true;
  },
  injectEnvVariables: function (a: string, b: string): void {
    // Nothing to do.
  },
  build: function (): void {
    // Nothing to do.
  },
  injectVcpkgToolchain: function (args: string, triplet: string): string { return args; },
  isNinjaGenerator: function (): boolean { return false; },
  setBaseLib(taskLib: ifacelib.BaseLib) {
    // Ensure the getArtifactsDir is mocked as follows.
    taskLib.getArtifactsDir = function (): string {
      return artifactStagingDirectory;
    }
    taskLib.getSrcDir = function (): string {
      return '/agent/w/1/s';
    }
  },
  normalizePath: function (s: string): string { return s }
});

tmr.setAnswers(answers);
utils.clearInputs();
tmr.setInput(globals.cmakeListsOrSettingsJson, 'CMakeSettingsJson');
tmr.setInput(globals.cmakeSettingsJsonPath, 'anyCMakeSettings.json');
tmr.setInput(globals.configurationRegexFilter, 'any.+');
tmr.setInput(globals.buildWithCMake, 'true');
tmr.setInput(globals.buildWithCMakeArgs, 'this must be unused');
tmr.setInput(globals.buildDirectory, artifactStagingDirectory);
process.env["BUILD_ARTIFACTSTAGINGDIRECTORY"] = artifactStagingDirectory;

// Act
tmr.run();
