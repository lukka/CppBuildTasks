// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as ma from 'azure-pipelines-task-lib/mock-answer';
import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';
import * as Globals from '../src/globals'

const taskPath = path.join(__dirname, '..', 'src', 'cmake-task.js');
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

// Arrange
const answers: ma.TaskLibAnswers = {
  'which': { 'cmake': '/usr/local/bin/cmake', 'node': '/usr/local/bin/node', 'ninja': '/usr/local/bin/ninja' },
  'checkPath': { '/usr/local/bin/cmake': true, '/usr/local/bin/node': true },
  'exec': {
    '/usr/local/bin/cmake': { 'code': 0, 'stdout': 'cmake test output here' },
    '/usr/local/bin/cmake -G Ninja -DVCPKG_CHAINLOAD_TOOLCHAIN_FILE=/existing/tool/chain.cmake -DCMAKE_MAKE_PROGRAM=/usr/local/bin/ninja -DCMAKE_TOOLCHAIN_FILE=/vcpkg/root/scripts/buildsystems/vcpkg.cmake /the/path/to':
      { 'code': 0, 'stdout': 'cmake -G ninja output here' },
    '/usr/local/bin/cmake --build . -cmake -build -args':
      { 'code': 0, 'stdout': 'cmake build output here' }
  }
} as ma.TaskLibAnswers;

tmr.setAnswers(answers);
tmr.setInput(Globals.cmakeListsOrSettingsJson, 'CMakeListsTxtAdvanced');
tmr.setInput(Globals.cmakeListsTxtPath, '/the/path/to/CMakeListsTxt');
tmr.setInput(Globals.cmakeAppendedArgs, '-G Ninja -DVCPKG_CHAINLOAD_TOOLCHAIN_FILE=/existing/tool/chain.cmake');
tmr.setInput(Globals.buildWithCMake, 'true');
tmr.setInput(Globals.buildWithCMakeArgs, '-cmake -build -args');
tmr.setInput(Globals.buildDirectory, '/path/to/build/dir/');
tmr.setInput(Globals.useVcpkgToolchainFile, "true");
process.env.VCPKG_ROOT = "/vcpkg/root/";

// Act
tmr.run();
