// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as ma from 'azure-pipelines-task-lib/mock-answer';
import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';
import * as utils from './test-utils'

import * as Globals from '../src/globals'

const taskPath = path.join(__dirname, '..', 'src', 'cmake-task.js');
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

// Arrange
const answers: ma.TaskLibAnswers = {
  'which': { 'cmake': '/usr/local/bin/cmake', 'node': '/usr/local/bin/node' },
  'checkPath': { '/usr/local/bin/cmake': true, '/usr/local/bin/node': true },
  'exec': {
    '/usr/local/bin/cmake': { 'code': 0, 'stdout': 'cmake test output here' },
    '/usr/local/bin/cmake -G Visual Studio 16 2019 -A ARM64 -DCMAKE_BUILD_TYPE=RelWithDebInfo .':
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
  writeFileSync: function (filePath, contents) {
    // Nothing to do
  },
  existsSync: function (filePath, contents) {
    return true;
  },
  readFileSync: function (filePath) {
    return '{\
      //comment\n\
      "configurations": [{\
      "environments": [{ "envvar": "envvalue"}],\
        "name": "anyName",\
        // I love comments\n\
        "configurationType": "RelWithDebInfo",\
        "generator": "Visual Studio 16 2019 ARM64",\
        "buildRoot": "/build/root/${env.envvar}",\
        "buildCommandArgs": "-cmake -build -args"\
      }]\
    }';
  },
  statSync: function (filePath) {
    const s: MockStats = new MockStats();
    return s;
  },
  chmodSync: function (filePath: string) {
    // Nothing to do
  }
});

tmr.registerMock('./utils', {
  getSourceDir: function (): string {
    return '/agent/w/1/s';
  },
  isWin32: function (): boolean {
    return true;
  },
  injectEnvVariables: function (a, b): void {
    // Nothing to do
  },
  getArtifactsDir: function (): string { return '/agent/w/1/a'; },
  build: function (): void {
    // Nothing to do
  },
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
const artifactStagingDirectory = "/agent/w/1/a/";
tmr.setInput(Globals.buildDirectory, artifactStagingDirectory);
process.env["BUILD_ARTIFACTSTAGINGDIRECTORY"] = artifactStagingDirectory;

// Act
tmr.run();
