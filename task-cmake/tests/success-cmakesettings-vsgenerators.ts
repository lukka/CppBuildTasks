// Copyright (c) 2019-2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as ma from 'azure-pipelines-task-lib/mock-answer';
import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';
import * as utils from './test-utils'
import * as ifacelib from '../../libs/base-lib/src/base-lib';
import { utilsMock } from './utils-mock';

import * as globals from '../../libs/run-cmake-lib/src/cmake-globals'

const taskPath = path.join(__dirname, '..', 'src', 'cmake-task.js');
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

// Arrange
const answers: ma.TaskLibAnswers = {
  'which': { 'cmake': '/usr/local/bin/cmake', 'node': '/usr/local/bin/node' },
  'checkPath': {
    '/usr/local/bin/cmake': true, '/usr/local/bin/node': true,
    'anyCMakeSettings.json': true
  },
  'exec': {
    '/usr/local/bin/cmake': { 'code': 0, 'stdout': 'cmake test output here' },
    '/usr/local/bin/cmake -GVisual Studio 16 2019 -AARM64 .':
      { 'code': 0, 'stdout': 'this is the cmake output' },
    '/usr/local/bin/cmake --build . --config RelWithDebInfo -- -cmake -build -args':
      { 'code': 0, 'stdout': 'cmake build output here' }
  },
  'mkdirP': { '/': { 'code': 0, 'stdout': 'mkdirP output' } }
} as ma.TaskLibAnswers;

class MockStats {
  mode = 600;
};
tmr.registerMock('fs', {
  writeFileSync: function (filePath: string, contents: string) {
    // Nothing to do
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
        "generator": "Visual Studio 16 2019 ARM64",\
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
    // Nothing to do
  }
});

utilsMock.isWin32 = function (): boolean {
  return true;
}
utilsMock.injectEnvVariables = function (a: string, b: string): void {
  // Nothing to do
}
utilsMock.build = function (): void {
  // Nothing to do
}
utilsMock.injectVcpkgToolchain = function (args: string[], triplet: string): string[] { return args; }
utilsMock.isNinjaGenerator = function (): boolean { return false; },
  utilsMock.setBaseLib = function (lib: ifacelib.BaseLib): void {
    lib.getArtifactsDir = function (): string {
      return '/agent/w/1/a';
    };
    lib.getSrcDir = function (): string {
      return '/agent/w/1/s';
    };
  }
utilsMock.normalizePath = function (s: string): string { return s; }
tmr.registerMock('./utils', utilsMock);

tmr.setAnswers(answers);
utils.clearInputs();
tmr.setInput(globals.cmakeListsOrSettingsJson, 'CMakeSettingsJson');
tmr.setInput(globals.cmakeSettingsJsonPath, 'anyCMakeSettings.json');
tmr.setInput(globals.configurationRegexFilter, 'any.+');
tmr.setInput(globals.buildWithCMake, 'true');
tmr.setInput(globals.buildWithCMakeArgs, 'this must be unused');
const artifactStagingDirectory = "/agent/w/1/a/";
tmr.setInput(globals.buildDirectory, artifactStagingDirectory);
process.env["BUILD_ARTIFACTSTAGINGDIRECTORY"] = artifactStagingDirectory;

// Act
tmr.run();
