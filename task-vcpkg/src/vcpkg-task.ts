// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as tl from 'azure-pipelines-task-lib/task';
import * as vcpkgrunner from './vcpkg-runner'
import * as vcpkgUtils from './vcpkg-utils';
import * as path from 'path';
import { libtask } from './task-lib';

async function main(): Promise<number> {
  try {
    tl.setResourcePath(path.join(__dirname, 'task.json'));
    let runner: vcpkgrunner.VcpkgRunner = new vcpkgrunner.VcpkgRunner(new libtask.TaskLib());
    await runner.run();
    tl.setResult(tl.TaskResult.Succeeded, tl.loc('vcpkgSucceeded'));
    return 0;
  } catch (err) {
    tl.debug('Error: ' + err);
    tl.error(err);
    tl.setResult(tl.TaskResult.Failed, tl.loc('vcpkgFailed', err));
    return -1000;
  }
}

// Main entry point of the task.
main();
