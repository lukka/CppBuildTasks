// Copyright (c) 2019-2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as tl from 'azure-pipelines-task-lib/task';
import * as tasklib from './task-lib'
import * as cmakerunner from './cmake-runner'
import * as utils from './utils'

async function main(): Promise<void> {
  try {
    // Ensure you pass the same instance to setBaseLib() and to CMakeRunner().
    const taskLib: tasklib.TaskLib = new tasklib.TaskLib();
    utils.setBaseLib(taskLib);
    const runner: cmakerunner.CMakeRunner = new cmakerunner.CMakeRunner(taskLib);
    await runner.run();
    tl.setResult(tl.TaskResult.Succeeded, "CMake succeeded.");
    return;
  } catch (err) {
    tl.debug('Error: ' + err);
    tl.error(err);
    tl.setResult(tl.TaskResult.Failed, `CMake failed with error: '${err}'.`);
    return;
  }
}

// Main entry point of the task.
main().catch(error => console.error("main() failed!", error));