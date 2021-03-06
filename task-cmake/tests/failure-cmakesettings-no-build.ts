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
    '/usr/local/bin/cmake -GNinja -DCMAKE_BUILD_TYPE=Release .':
      { 'code': 1, 'stdout': 'cmake output here' }
  },
  'mkdirP': {
    '/': { 'code': 0, 'stdout': 'mkdirP / output' }
  }
} as ma.TaskLibAnswers;

class MockStats {
  mode = 600;
};
tmr.registerMock('fs', {
  writeFileSync: function (filePath: string, contents: string) {
    // Nothing to do.
  },
  existsSync: function (filePath: string, contents: string) {
    return true;
  },
  readFileSync: function (filePath: string) {
    const retVal: any = {
      'environments': [
        { 'globalENVVAR': 'globalENVVALUE' }, {
          'environment': 'globalENVNAME',
          'namespace': 'namespace',
          'globalLOCALAPPDATA': 'globalLOCALAPPDATAresolved'
        },
      ],
      'configurations': [
        {
          'environments': [
            { 'ENVVAR': 'ENVVALUE' }, {
              'environment': 'ENVNAME',
              'namespace': 'namespace',
              'LOCALAPPDATA': 'LOCALAPPDATAresolved'
            }
          ],
          'name': 'x64-Release',
          'generator': 'Ninja',
          'configurationType': 'Release',
          'inheritEnvironments': ["ENVNAME"],
          'buildRoot':
            '${env.ENVVAR}\\${namespace.LOCALAPPDATA}\\CMakeBuild\\${workspaceHash}\\build\\${name}',
          'cmakeCommandArgs': '',
          'buildCommandArgs': '-m -v:minimal',
        },
        {
          'environments': [
            { 'ENVVAR': 'ENVVALUE' }, {
              'environment': 'ENVNAME',
              'namespace': 'namespace',
              'LOCALAPPDATA': 'LOCALAPPDATAresolved',
              'deref': '${namespace.varname}',
              'varname': 'derefValue'
            }
          ],
          'name': 'Linux-Debug',
          'generator': 'Ninja',
          'configurationType': 'Debug',
          'inheritEnvironments': ["ENVNAME", "globalENVNAME"],
          'buildRoot':
            '${env.globalENVVAR}/${env.ENVVAR}/${namespace.globalLOCALAPPDATA}/${namespace.deref}/build/${name}',
          'cmakeCommandArgs': '',
          'buildCommandArgs': '-make -build -args',
          'variables': [{
            'name': 'CMAKE_ANY_FLAG',
            'value': 'OFF',
            'type': 'boolean'
          }]
        }]
    };
    return JSON.stringify(retVal);
  },
  statSync: function (filePath: string) {
    const s: MockStats = new MockStats();
    return s;
  },
  chmodSync: function (filePath: string) {
    // Nothing to do.
  }
});

utilsMock.isWin32 = function (): boolean {
  return true;
}
utilsMock.injectEnvVariables = function (a: string, b: string): void {
  // Nothing to do.
}
utilsMock.build = function (): void {
  // Nothing to do.
}
utilsMock.isNinjaGenerator = function (): boolean { return false; },
  utilsMock.setBaseLib = function (taskLib: ifacelib.BaseLib): void {
    // Ensure the getArtifactsDir is mocked as follows.
    taskLib.getArtifactsDir = function (): string { return '/agent/w/1/a'; }
    taskLib.getSrcDir = function (): string {
      return '/agent/w/1/s';
    }
  }
utilsMock.normalizePath = function (s: string): string { return s; }
tmr.registerMock('./utils', utilsMock);

tmr.setAnswers(answers);
utils.clearInputs();
tmr.setInput(globals.cmakeListsOrSettingsJson, 'CMakeSettingsJson');
tmr.setInput(globals.cmakeSettingsJsonPath, 'anyCMakeSettings.json');
tmr.setInput(globals.configurationRegexFilter, '(x.+|Release.*)');
tmr.setInput(globals.buildWithCMake, 'true');
tmr.setInput(globals.buildWithCMakeArgs, 'this must be unused');
tmr.setInput(globals.buildDirectory, '/path/to/build/dir/');
process.env["Build.BinariesDirectory"] = "/agent/w/1/a/";

// Act
tmr.run();
