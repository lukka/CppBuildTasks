import * as ma from 'azure-pipelines-task-lib/mock-answer';
import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';

let taskPath = path.join(__dirname, '..', 'src', 'cmake-task.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

// Arrange
let answers: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
  'which': {'cmake': '/usr/local/bin/cmake', 'node': '/usr/local/bin/node'},
  'checkPath': {'/usr/local/bin/cmake': true, '/usr/local/bin/node': true},
  'exec': {
    '/usr/local/bin/cmake': {'code': -1, 'stdout': 'cmake error output here'}
  }
};
tmr.setInput('cmakeSettingsJsonPath', 'anypath');

// Act
tmr.run();