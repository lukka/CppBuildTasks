import * as tl from 'azure-pipelines-task-lib/task';
import * as vcpkgrunner from './vcpkg-runner'
import * as path from 'path';

async function main(): Promise<number> {
  try {
    tl.setResourcePath(path.join(__dirname, 'task.json'));
    let runner: vcpkgrunner.VcpkgRunner = new vcpkgrunner.VcpkgRunner();
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
