// Copyright (c) 2019-2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as ma from 'azure-pipelines-task-lib/mock-answer';
import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';
import * as globals from '../../libs/run-cmake-lib/src/cmake-globals'
import * as utils from './test-utils'

const taskPath = path.join(__dirname, '..', 'src', 'cmake-task.js');
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

// Arrange
const answers: ma.TaskLibAnswers = {
  'which': {'cmake': '/usr/local/bin/cmake', 'node': '/usr/local/bin/node'},
  'checkPath': {'/usr/local/bin/cmake': true, '/usr/local/bin/node': true},
  'exec': {
    '/usr/local/bin/cmake': {'code': 0, 'stdout': 'cmake test output here'},
    '/usr/local/bin/cmake -G Ninja':
        {'code': 0, 'stdout': 'cmake -G ninja output here'}
  }
} as ma.TaskLibAnswers;
tmr.setAnswers(answers);
utils.clearInputs();
tmr.setInput(globals.cmakeListsOrSettingsJson, 'CMakeSettingsJson');

// Act
tmr.run();
