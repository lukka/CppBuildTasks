import * as tl from 'azure-pipelines-task-lib/task';
import * as cmakerunner from './cmake-runner'
import * as path from 'path'

async function main(): Promise<void> {
  try {
    tl.setResourcePath(path.join( __dirname, 'task.json'));
    let runner: cmakerunner.CMakeRunner = new cmakerunner.CMakeRunner();
    await runner.run();
    tl.setResult(tl.TaskResult.Succeeded, tl.loc('CMakeSuccess'));
    return;
  } catch (err) {
    tl.debug('Error: ' + err);
    tl.error(err);
    tl.setResult(tl.TaskResult.Failed, tl.loc('CMakeFailed', err));
    return;
  }
}

// Main entry point of the task.
main();