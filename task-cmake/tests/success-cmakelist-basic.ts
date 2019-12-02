// Copyright (c) 2019-2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as ma from 'azure-pipelines-task-lib/mock-answer';
import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';
import * as globals from '../../libs/run-cmake-lib/src/cmake-globals'

const taskPath = path.join(__dirname, '..', 'src', 'cmake-task.js');
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

// Arrange
const answers: ma.TaskLibAnswers = {
  'which': { 'cmake': '/usr/local/bin/cmake', 'node': '/usr/local/bin/node' },
  'checkPath': { '/usr/local/bin/cmake': true, '/usr/local/bin/node': true },
  'exec': {
    '/usr/local/bin/cmake': { 'code': 0, 'stdout': 'cmake test output here' },
    '/usr/local/bin/cmake -G Ninja -DCMAKE_MAKE_PROGRAM=ninjaPath -DCMAKE_BUILD_TYPE=DebugBasic path':
      { 'code': 0, 'stdout': 'cmake -G ninja output here' },
    '/usr/local/bin/cmake --build . -cmake -build -args':
      { 'code': 0, 'output': 'output of build with cmake' }
  }
} as ma.TaskLibAnswers;
tmr.setAnswers(answers);
tmr.setInput(globals.cmakeListsOrSettingsJson, 'CMakeListsTxtBasic');
tmr.setInput(globals.cmakeListsTxtPath, 'path/cmakeliststxtPath');
tmr.setInput(globals.cmakeGenerator, 'Ninja');
tmr.setInput(globals.ninjaPath, 'ninjaPath');
tmr.setInput(globals.buildDirectory, 'buildDirPath');
tmr.setInput(globals.buildWithCMake, 'true');
tmr.setInput(globals.buildWithCMakeArgs, '-cmake -build -args');
tmr.setInput(globals.buildDirectory, '/path/to/build/dir/');
tmr.setInput(globals.cmakeBuildType, 'DebugBasic');

// Act
tmr.run();
