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
    '/usr/local/bin/cmake -G Visual Studio 16 2019 -A x64 -DCMAKE_BUILD_TYPE=Debug -DCMAKE_TOOLCHAIN_FILE:string=D:/src/vcpkg/scripts/buildsystems/vcpkg.cmake .':
      { 'code': 0, 'stdout': 'cmake output here' },
    '/usr/local/bin/cmake -G Ninja -DCMAKE_BUILD_TYPE=Debug -DCMAKE_ANY_FLAG:boolean=OFF -DCONFIGURATION:STRING=ResolvedConfiguration .': {
      'code': 0, 'stdout': 'cmake output here'
    },
    '/usr/local/bin/cmake --build . -make -build -args':
      { 'code': 0, 'stdout': 'cmake build output here' }
  },
  'mkdirP': { '/': { 'code': 0, 'stdout': 'mkdirP / output' } }
} as ma.TaskLibAnswers;

class MockStats {
  mode = 600;
};
tmr.registerMock('fs', {
  writeFileSync: function (filePath, contents) { 
    // Nothing to do.
  },
  existsSync: function (filePath, contents) {
    return true;
  },
  readFileSync: function (filePath) {
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
            },
            {
              'namespace': '',
              'CONFIGURATIONTYPE': 'Debug'
            }
          ],
          'name': 'x86-Debug',
          'generator': 'Visual Studio 16 2019 x64',
          'configurationType': '${CONFIGURATIONTYPE}',
          'inheritEnvironments': ["ENVNAME"],
          'buildRoot':
            '${env.ENVVAR}\\${namespace.LOCALAPPDATA}\\CMakeBuild\\${workspaceHash}\\build\\${name}',
          'cmakeCommandArgs': '',
          'buildCommandArgs': '-m -v:minimal',
          'variables': [{
            'name': 'CMAKE_TOOLCHAIN_FILE',
            'value': 'D:/src/vcpkg/scripts/buildsystems/vcpkg.cmake',
          }]
        },
        {
          'environments': [
            { 'ENVVAR': 'ENVVALUE' }, {
              'environment': 'ENVNAME',
              'namespace': 'namespace',
              'LOCALAPPDATA': 'LOCALAPPDATAresolved',
              'deref': '${namespace.varname}',
              'varname': 'derefValue'
            },
            {
              'namespace': '',
              'CONFIGURATION': 'ResolvedConfiguration'
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
          },
          {
            'name': 'CONFIGURATION',
            'value': '${CONFIGURATION}',
            'type': 'STRING'
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
tmr.setInput(Globals.configurationRegexFilter, '(x.+|Linux.*)');
tmr.setInput(Globals.buildWithCMake, 'true');
tmr.setInput(Globals.buildWithCMakeArgs, 'this must be unused');
tmr.setInput(Globals.buildDirectory, '/path/to/build/dir/');
tmr.setInput(Globals.useVcpkgToolchainFile, "false");
process.env["Build.BinariesDirectory"] = "/agent/w/1/b/";
process.env.VCPKG_ROOT = "/vcpkg/root/";

// Act
tmr.run();
