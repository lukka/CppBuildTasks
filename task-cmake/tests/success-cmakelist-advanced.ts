// Copyright (c) 2019-2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as ma from 'azure-pipelines-task-lib/mock-answer';
import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';
import * as globals from '../../libs/run-cmake-lib/src/cmake-globals'

const taskPath = path.join(__dirname, '..', 'src', 'cmake-task.js');
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);
const fakeDir = path.resolve('thePathTo');
const cmakeListsTxtPath = path.join(fakeDir, 'cmakeliststxtPath');

// Arrange
const answers: ma.TaskLibAnswers = {
  'which': { 'cmake': '/usr/local/bin/cmake', 'node': '/usr/local/bin/node' },
  'checkPath': {
    '/usr/local/bin/cmake': true, '/usr/local/bin/node': true,
    [cmakeListsTxtPath]: true
  },
  'exec': {
    '/usr/local/bin/cmake': { 'code': 0, 'stdout': 'cmake test output here' },
    [`/usr/local/bin/cmake -G Visual Studio -DCMAKE_BUILD_TYPE=DebugAdvanced ${fakeDir}`]:
      { 'code': 0, 'stdout': 'cmake -G "Visual Studio" output here' },
    '/usr/local/bin/cmake --build . -cmake -build -args':
      { 'code': 0, 'stdout': 'cmake build output here' }
  }
} as ma.TaskLibAnswers;
tmr.setAnswers(answers);
tmr.setInput(globals.cmakeListsOrSettingsJson, 'CMakeListsTxtAdvanced');
tmr.setInput(globals.cmakeListsTxtPath, cmakeListsTxtPath);
tmr.setInput(globals.cmakeAppendedArgs, '-G "Visual Studio" -DCMAKE_BUILD_TYPE=DebugAdvanced');
tmr.setInput(globals.buildWithCMake, 'true');
tmr.setInput(globals.buildWithCMakeArgs, '-cmake -build -args');
tmr.setInput(globals.buildDirectory, '/path/to/build/dir/');

// Act
tmr.run();
