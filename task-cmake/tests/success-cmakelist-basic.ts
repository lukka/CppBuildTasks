import * as ma from 'azure-pipelines-task-lib/mock-answer';
import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';
import { Globals } from '../src/globals'

let taskPath = path.join(__dirname, '..', 'src', 'cmake-task.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

// Arrange
let answers: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
  'which': { 'cmake': '/usr/local/bin/cmake', 'node': '/usr/local/bin/node' },
  'checkPath': { '/usr/local/bin/cmake': true, '/usr/local/bin/node': true },
  'exec': {
    '/usr/local/bin/cmake': { 'code': 0, 'stdout': 'cmake test output here' },
    '/usr/local/bin/cmake -G Ninja -DCMAKE_MAKE_PROGRAM=ninjaPath -DCMAKE_BUILD_TYPE=DebugBasic path':
      { 'code': 0, 'stdout': 'cmake -G ninja output here' },
    '/usr/local/bin/cmake --build . -cmake -build -args':
      { 'code': 0, 'output': 'output of build with cmake' }
  }
};
tmr.setAnswers(answers);
tmr.setInput(Globals.cmakeListsOrSettingsJson, 'CMakeListsTxtBasic');
tmr.setInput(Globals.cmakeListsTxtPath, 'path/cmakeliststxtPath');
tmr.setInput(Globals.cmakeGenerator, 'Ninja');
tmr.setInput(Globals.ninjaPath, 'ninjaPath');
tmr.setInput(Globals.buildDirectory, 'buildDirPath');
tmr.setInput(Globals.buildWithCMake, 'true');
tmr.setInput(Globals.buildWithCMakeArgs, '-cmake -build -args');
tmr.setInput(Globals.buildDirectory, '/path/to/build/dir/');
tmr.setInput(Globals.cmakeBuildType, 'DebugBasic');

// Act
tmr.run();
