// Copyright (c) 2019-2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as tl from 'azure-pipelines-task-lib/task';
import * as vcpkgrunner from './vcpkg-runner'
import * as vcpkgUtils from './vcpkg-utils';
import * as tasklib from './task-lib';

async function main(): Promise<number> {
  try {
    // Ensure you pass the same instance to setBaseLib() and to VcpkgRunner().
    const taskLib: tasklib.TaskLib = new tasklib.TaskLib();
    vcpkgUtils.setBaseLib(taskLib);
    const runner: vcpkgrunner.VcpkgRunner = new vcpkgrunner.VcpkgRunner(taskLib);
    await runner.run();
    tl.setResult(tl.TaskResult.Succeeded, "Task completed succesfully.");
    return 0;
  } catch (err) {
    tl.debug('Error: ' + err);
    tl.error(err);
    tl.setResult(tl.TaskResult.Failed, `vcpkg failed with error: '${err}'.`);
    return -1000;
  }
}

// Main entry point of the task.
main().catch(error => console.error("main() failed!", error));