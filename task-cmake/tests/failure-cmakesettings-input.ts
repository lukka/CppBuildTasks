import * as ma from 'azure-pipelines-task-lib/mock-answer';
import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';
import {Globals} from '../src/globals'
import * as utils from './test-utils'

let taskPath = path.join(__dirname, '..', 'src', 'cmake-task.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

// Arrange
let answers: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
  'which': {'cmake': '/usr/local/bin/cmake', 'node': '/usr/local/bin/node'},
  'checkPath': {'/usr/local/bin/cmake': true, '/usr/local/bin/node': true},
  'exec': {
    '/usr/local/bin/cmake': {'code': 0, 'stdout': 'cmake test output here'},
    '/usr/local/bin/cmake -G Ninja':
        {'code': 0, 'stdout': 'cmake -G ninja output here'}
  }
};
tmr.setAnswers(answers);
utils.clearInputs();
tmr.setInput(Globals.cmakeListsOrSettingsJson, 'CMakeSettingsJson');

// Act
tmr.run();
