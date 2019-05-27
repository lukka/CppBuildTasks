import * as ma from 'azure-pipelines-task-lib/mock-answer';
import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';
import {Globals} from '../src/globals'

let taskPath = path.join(__dirname, '..', 'src', 'cmake-task.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

// Arrange
let answers: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
  'which': {'cmake': '/usr/local/bin/cmake', 'node': '/usr/local/bin/node'},
  'checkPath': {'/usr/local/bin/cmake': true, '/usr/local/bin/node': true},
  'exec': {
    '/usr/local/bin/cmake': {'code': 0, 'stdout': 'cmake test output here'},
    '/usr/local/bin/cmake -G Visual Studio -DCMAKE_BUILD_TYPE=DebugAdvanced thePathTo':
        {'code': 0, 'stdout': 'cmake -G "Visual Studio" output here'},
    '/usr/local/bin/cmake --build . -cmake -build -args':
        {'code': 0, 'stdout': 'cmake build output here'}
  }
};
tmr.setAnswers(answers);
tmr.setInput(Globals.cmakeListsOrSettingsJson, 'CMakeListsTxtAdvanced');
tmr.setInput(Globals.cmakeListsTxtPath, 'thePathTo/CMakeListsTxt');
tmr.setInput(Globals.cmakeAppendedArgs, '-G "Visual Studio" -DCMAKE_BUILD_TYPE=DebugAdvanced');
tmr.setInput(Globals.buildWithCMake, 'true');
tmr.setInput(Globals.buildWithCMakeArgs, '-cmake -build -args');
tmr.setInput(Globals.buildDirectory, '/path/to/build/dir/');

// Act
tmr.run();
