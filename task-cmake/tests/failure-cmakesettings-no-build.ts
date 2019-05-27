import * as ma from 'azure-pipelines-task-lib/mock-answer';
import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';

import { Globals } from '../src/globals'

import * as utils from './test-utils'
import * as cmakeutils from '../src/utils'

let taskPath = path.join(__dirname, '..', 'src', 'cmake-task.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

// Arrange
let answers: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
  'which': { 'cmake': '/usr/local/bin/cmake', 'node': '/usr/local/bin/node' },
  'checkPath': { '/usr/local/bin/cmake': true, '/usr/local/bin/node': true },
  'exec': {
    '/usr/local/bin/cmake': { 'code': 0, 'stdout': 'cmake test output here' },
    '/usr/local/bin/cmake -G Ninja -DCMAKE_BUILD_TYPE=Release .':
      { 'code': 1, 'stdout': 'cmake output here' }
  },
  'mkdirP': {
    '/': { 'code': 0, 'stdout': 'mkdirP / output' }
  }
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
    let s: MockStats = new MockStats();
    return s;
  },
  chmodSync: function (filePath: string) {
  }
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
  isNinjaGenerator: function (): boolean { return false; }
});

tmr.setAnswers(answers);
utils.clearInputs();
tmr.setInput(Globals.cmakeListsOrSettingsJson, 'CMakeSettingsJson');
tmr.setInput(Globals.cmakeSettingsJsonPath, 'anyCMakeSettings.json');
tmr.setInput(Globals.configurationRegexFilter, '(x.+|Release.*)');
tmr.setInput(Globals.buildWithCMake, 'true');
tmr.setInput(Globals.buildWithCMakeArgs, 'this must be unused');
tmr.setInput(Globals.buildDirectory, '/path/to/build/dir/');
process.env["Build.BinariesDirectory"] = "/agent/w/1/a/";

// Act
tmr.run();
