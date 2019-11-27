// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as path from 'path';
import { libaction } from './action-lib';
import * as vcpkgrunner from './vcpkg-runner';
import * as core from '@actions/core'
import * as vcpkgUtils from './vcpkg-utils';

async function main(): Promise<number> {
  try {
    vcpkgUtils.setIBaseLib(new libaction.TaskLib());
    let runner: vcpkgrunner.VcpkgRunner = new vcpkgrunner.VcpkgRunner(new libaction.TaskLib());
    await runner.run();
    core.info('vcpkgSucceeded');
    return 0;
  } catch (err) {
    core.debug('Error: ' + err);
    core.error(err);
    core.setFailed('vcpkgFailed');
    return -1000;
  }
}

// Main entry point of the task.
main();
