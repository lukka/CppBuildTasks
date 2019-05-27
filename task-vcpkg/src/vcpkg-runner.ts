import * as tl from 'azure-pipelines-task-lib/task';
import * as trm from 'azure-pipelines-task-lib/toolrunner';
import * as path from 'path';
import { Globals } from './globals';
import * as vcpkgutils from './vcpkg-utils'

const vcpkgRemoteUrlLastFileName: string = 'vcpkg_remote_url.last';

export class VcpkgRunner {
  vcpkgDestPath: string;
  vcpkgArgs: string;
  defaultVcpkgUrl: string;
  vcpkgURL: string;

  /**
   * Branch name or commit id of vcpkg repository to fetch.
   * @type {string} The commit id or the branch name.
   * @memberof VcpkgRunner
   */
  vcpkgCommitId: string;
  vcpkgTriplet: string;
  options: trm.IExecOptions;

  private fetchInput(): void {
    this.vcpkgArgs = tl.getInput(Globals.vcpkgArguments, true);
    this.defaultVcpkgUrl = 'https://github.com/Microsoft/vcpkg.git';
    this.vcpkgURL =
      tl.getInput(Globals.vcpkgGitURL) || this.defaultVcpkgUrl;
    this.vcpkgCommitId =
      tl.getInput(Globals.vcpkgCommitId) || 'master';
    this.vcpkgDestPath = path.join(vcpkgutils.getBinDir(), 'vcpkg');
    this.vcpkgTriplet = tl.getInput(Globals.vcpkgTriplet, false);
  }

  async run(): Promise<void> {
    tl.debug(tl.loc('TaskStarting'));
    await this.fetchInput();
    // Override the VCPKG_ROOT tool, it must point to this vcpkg instance.
    process.env.VCPKG_ROOT = this.vcpkgDestPath;
    tl.setVariable("VCPKG_ROOT", this.vcpkgDestPath);
    console.log(`Set task output variable '${Globals.outVcpkgRootPath}' to value: ${
      this.vcpkgDestPath}`);
    tl.setVariable(Globals.outVcpkgRootPath, this.vcpkgDestPath);

    this.options = <trm.IExecOptions>{
      cwd: this.vcpkgDestPath,
      failOnStdErr: false,
      errStream: process.stdout,
      outStream: process.stdout,
      ignoreReturnCode: true,
      silent: false,
      windowsVerbatimArguments: false,
      env: process.env
    };

    let needRebuild: boolean = await this.updateRepo();
    if (needRebuild) {
      await this.build()
    }

    await this.updatePackages();
  }

  private async updatePackages(): Promise<void> {
    let vcpkgPath: string = path.join(this.vcpkgDestPath, 'vcpkg');
    if (vcpkgutils.isWin32()) {
      vcpkgPath += '.exe';
    }

    // vcpkg remove --outdated --recurse
    const removeCmd = 'remove --outdated --recurse';
    let vcpkgTool = tl.tool(vcpkgPath);
    console.log(
      `Running 'vcpkg ${removeCmd}' in directory '${this.vcpkgDestPath}' ...`);
    vcpkgTool.line(removeCmd);
    vcpkgutils.throwIfErrorCode(await vcpkgTool.exec(this.options));

    // vcpkg install --recurse <list of packages>
    vcpkgTool = tl.tool(vcpkgPath);
    let installCmd: string = `install --recurse ${this.vcpkgArgs}`;
    // Append triplet, if not provided get or guess the default one.
    if (!this.vcpkgTriplet) {
      this.vcpkgTriplet = vcpkgutils.getDefaultTriplet();
    }

    installCmd += ` --triplet ${this.vcpkgTriplet}`;

    // Set the used triplet in VCPKG_TRIPLET environment variable
    process.env['VCPKG_TRIPLET'] = this.vcpkgTriplet;
    tl.setVariable("VCPKG_TRIPLET", this.vcpkgTriplet);

    // Set output variable containing the use triplet
    console.log(`Set task output variable '${Globals.outVcpkgTriplet}' to value: ${
      this.vcpkgTriplet}`);
    tl.setVariable(Globals.outVcpkgTriplet, this.vcpkgTriplet);

    vcpkgTool.line(installCmd);
    console.log(
      `Running 'vcpkg ${installCmd}' in directory '${this.vcpkgDestPath}' ...`);
    vcpkgutils.throwIfErrorCode(await vcpkgTool.exec(this.options));
  }

  private async updateRepo(): Promise<boolean> {
    let gitPath: string = tl.which('git', true);
    // Git update or clone depending on content of vcpkgDestPath.
    const cloneCompletedFilePath = path.join(this.vcpkgDestPath, vcpkgRemoteUrlLastFileName);

    // Update the source of vcpkg.
    let updated: boolean = false;
    let needRebuild: boolean = false;
    let remoteUrlAndCommitId: string = this.vcpkgURL + this.vcpkgCommitId;
    let res: boolean = vcpkgutils.directoryExists(this.vcpkgDestPath);
    tl.debug(`directory ${this.vcpkgDestPath} exists: ${res}`);
    if (res) {
      let [ok, remoteUrlAndCommitIdLast] = vcpkgutils.readFile(cloneCompletedFilePath);
      tl.debug(`cloned check: ${ok}, ${remoteUrlAndCommitIdLast}`);
      if (ok) {
        tl.debug(`lastcommitid=${remoteUrlAndCommitIdLast}, actualcommitid=${remoteUrlAndCommitId}`);
        if (remoteUrlAndCommitIdLast == remoteUrlAndCommitId) {
          // Update from remote repository.
          await tl.exec(gitPath, ['remote', 'update'], this.options);
          // Use git status to understand if we need to rebuild vcpkg since the last downloaded 
          // branch is old.
          let res: trm.IExecSyncResult = await tl.execSync(gitPath, ['status', '-uno'], this.options);
          let uptodate = res.stdout.match("up to date");
          let detached = res.stdout.match("detached");
          if (!uptodate && !detached) {
            await tl.exec(gitPath, ['pull', 'origin', this.vcpkgCommitId], this.options);
            needRebuild = true;
            console.log(tl.loc('vcpkgNeedsRebuildRepoUpdated'));
          }
          updated = true;
        }
      }
    }

    // Git clone.
    if (!updated) {
      needRebuild = true;
      tl.rmRF(this.vcpkgDestPath);
      tl.mkdirP(this.vcpkgDestPath);
      tl.cd(this.vcpkgDestPath);

      let gitTool = tl.tool(gitPath);
      gitTool.arg(['init']);
      vcpkgutils.throwIfErrorCode(await gitTool.exec(this.options));

      gitTool = tl.tool(gitPath);
      gitTool.arg(['fetch', this.vcpkgURL, this.vcpkgCommitId]);
      vcpkgutils.throwIfErrorCode(await gitTool.exec(this.options));

      gitTool = tl.tool(gitPath);
      gitTool.arg(['checkout', '--force', 'FETCH_HEAD']);
      vcpkgutils.throwIfErrorCode(await gitTool.exec(this.options));

      tl.writeFile(cloneCompletedFilePath, remoteUrlAndCommitId);
    }

    // If the executable file ./vcpkg/vcpkg is not present, force build. The fact that the repository
    // is up to date is meaningless.
    let vcpkgPath: string = path.join(this.vcpkgDestPath, 'vcpkg');
    if (!vcpkgutils.fileExists(vcpkgPath)) {
      console.log(tl.loc('vcpkgNeedsRebuildMissingExecutable'));
      needRebuild = true;
    }

    return needRebuild;
  }

  private async build(): Promise<void> {
    // Build vcpkg.
    let bootstrap: string = 'bootstrap-vcpkg';
    if (vcpkgutils.isWin32()) {
      bootstrap += '.bat';
    } else {
      bootstrap += '.sh';
    }

    if (vcpkgutils.isWin32()) {
      let cmdPath: string = tl.which('cmd.exe', true);
      let cmdTool = tl.tool(cmdPath);
      cmdTool.arg(['/c', path.join(this.vcpkgDestPath, bootstrap)]);
      vcpkgutils.throwIfErrorCode(await cmdTool.exec(this.options));
    } else {
      let shPath: string = tl.which('sh', true);
      let shTool = tl.tool(shPath);
      shTool.arg(['-c', path.join(this.vcpkgDestPath, bootstrap)]);
      vcpkgutils.throwIfErrorCode(await shTool.exec(this.options));
    }
  }
}
