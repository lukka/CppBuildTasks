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
  isWin32: function (): boolean {
    console.log("isWin32<<");
    return true;
  },
  injectEnvVariables: function (a: string, b: string): void {
    // Nothing to do.
    console.log("injectEnvVariables<<");
  },
  build: function (): void {
    // Nothing to do.
    console.log("build<<");
  },
  injectVcpkgToolchain: function (args: string, triplet: string): string { return args; },
  isNinjaGenerator: function (): boolean { return false; },
  setBaseLib(taskLib: ifacelib.BaseLib) {
    // Ensure the getArtifactsDir is mocked as follows.
    taskLib.getArtifactsDir = function (): string { return '/agent/w/1/a'; }
    taskLib.getSrcDir = function (): string {
      console.log("getSourceDir<<");
      return '/agent/w/1/s';
    }
  },
  normalizePath(s: string) { return s; }
});

tmr.setAnswers(answers);
utils.clearInputs();
tmr.setInput(globals.cmakeListsOrSettingsJson, 'CMakeSettingsJson');
tmr.setInput(globals.cmakeSettingsJsonPath, 'anyCMakeSettings.json');
tmr.setInput(globals.configurationRegexFilter, '(x.+|Linux.*)');
tmr.setInput(globals.buildWithCMake, 'true');
tmr.setInput(globals.buildWithCMakeArgs, 'this must be unused');
tmr.setInput(globals.buildDirectory, '/path/to/build/dir/');
tmr.setInput(globals.useVcpkgToolchainFile, "false");
process.env["Build.BinariesDirectory"] = "/agent/w/1/b/";
process.env.RUNVCPKG_VCPKG_ROOT = "/vcpkg/root/";

// Act
tmr.run();
