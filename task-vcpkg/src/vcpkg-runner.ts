import * as tl from 'azure-pipelines-task-lib/task';
import * as trm from 'azure-pipelines-task-lib/toolrunner';
import * as path from 'path';
import { Globals } from './globals';
import * as vcpkgUtils from './vcpkg-utils'

const vcpkgRemoteUrlLastFileName: string = 'vcpkg_remote_url.last';

export class VcpkgRunner {
  vcpkgDestPath: string;
  vcpkgArgs: string;
  defaultVcpkgUrl: string;
  vcpkgURL: string;

  /**
   * Git ref (a branch or a tag, not a commit id) of vcpkg repository to fetch.
   * @type {string} The ref name (e.g. the branch or tag name).
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
    this.vcpkgDestPath = path.join(vcpkgUtils.getBinDir(), 'vcpkg');
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
    await this.prepareForCache();
  }

  private async prepareForCache(): Promise<void> {
    tl.writeFile(path.join(this.vcpkgDestPath, '.artifactignore'), "!.git\n/buildtrees\n/packages\n/downloads\n");
  }

  private async updatePackages(): Promise<void> {
    let vcpkgPath: string = path.join(this.vcpkgDestPath, 'vcpkg');
    if (vcpkgUtils.isWin32()) {
      vcpkgPath += '.exe';
    }

    // vcpkg remove --outdated --recurse
    const removeCmd = 'remove --outdated --recurse';
    let vcpkgTool = tl.tool(vcpkgPath);
    console.log(
      `Running 'vcpkg ${removeCmd}' in directory '${this.vcpkgDestPath}' ...`);
    vcpkgTool.line(removeCmd);
    vcpkgUtils.throwIfErrorCode(await vcpkgTool.exec(this.options));

    // vcpkg install --recurse <list of packages>
    vcpkgTool = tl.tool(vcpkgPath);
    let installCmd: string = `install --recurse ${this.vcpkgArgs}`;

    // Extract triplet from arguments for vcpkg.
    const extractedTriplet: string | null = vcpkgUtils.extractTriplet(installCmd, vcpkgUtils.readFile);
    // Append triplet, only if provided by the user in the task arguments
    if (extractedTriplet !== null) {
      if (this.vcpkgTriplet) {
        tl.warning(`Ignoring the task provided triplet: '${this.vcpkgTriplet}'.`);
      }
      this.vcpkgTriplet = extractedTriplet;
      console.log(`Extracted from command line triplet '${this.vcpkgTriplet}'.`);
    } else {
      // If triplet is nor specified in arguments, nor in task, let's deduce it from
      // agent context (i.e. its OS).
      if (!this.vcpkgTriplet) {
        console.log(`Deducing triplet from environment...`);
        this.vcpkgTriplet = vcpkgUtils.getDefaultTriplet();
      }

      console.log(`Using triplet '${this.vcpkgTriplet}'.`);

      // Add the triplet argument to the command line.
      installCmd += ` --triplet ${this.vcpkgTriplet}`;
    }

    // Set the used triplet in VCPKG_TRIPLET environment variable
    process.env['VCPKG_TRIPLET'] = this.vcpkgTriplet;

    // Set the user specified triplet in VCPKG_TRIPLET task variable
    tl.setVariable("VCPKG_TRIPLET", this.vcpkgTriplet);

    // Set output variable containing the use triplet
    console.log(`Set task output variable '${Globals.outVcpkgTriplet}' to value: ${
      this.vcpkgTriplet}`);
    tl.setVariable(Globals.outVcpkgTriplet, this.vcpkgTriplet);

    vcpkgTool.line(installCmd);
    console.log(
      `Running 'vcpkg ${installCmd}' in directory '${this.vcpkgDestPath}' ...`);
    vcpkgUtils.throwIfErrorCode(await vcpkgTool.exec(this.options));
  }

  private async updateRepo(): Promise<boolean> {
    let gitPath: string = tl.which('git', true);
    // Git update or clone depending on content of vcpkgDestPath.
    const cloneCompletedFilePath = path.join(this.vcpkgDestPath, vcpkgRemoteUrlLastFileName);

    // Update the source of vcpkg.
    let updated: boolean = false;
    let needRebuild: boolean = false;
    let remoteUrlAndCommitId: string = this.vcpkgURL + this.vcpkgCommitId;
    let res: boolean = vcpkgUtils.directoryExists(this.vcpkgDestPath);
    tl.debug(`directory ${this.vcpkgDestPath} exists: ${res}`);
    if (res) {
      let [ok, remoteUrlAndCommitIdLast] = vcpkgUtils.readFile(cloneCompletedFilePath);
      tl.debug(`cloned check: ${ok}, ${remoteUrlAndCommitIdLast}`);
      if (ok) {
        tl.debug(`lastcommitid=${remoteUrlAndCommitIdLast}, actualcommitid=${remoteUrlAndCommitId}`);
        if (remoteUrlAndCommitIdLast == remoteUrlAndCommitId) {
          // Update from remote repository.
          tl.debug(this.options.cwd);
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

      gitTool = tl.tool(gitPath);
      gitTool.arg(['clone', this.vcpkgURL, '-n', '.']);
      vcpkgUtils.throwIfErrorCode(await gitTool.exec(this.options));

      gitTool = tl.tool(gitPath);
      gitTool.arg(['checkout', '--force', this.vcpkgCommitId]);
      vcpkgUtils.throwIfErrorCode(await gitTool.exec(this.options));

      tl.writeFile(cloneCompletedFilePath, remoteUrlAndCommitId);
    }

    // If the executable file ./vcpkg/vcpkg is not present, force build. The fact that the repository
    // is up to date is meaningless.
    const vcpkgExe: string = vcpkgUtils.isWin32() ? "vcpkg.exe" : "vcpkg"
    const vcpkgPath: string = path.join(this.vcpkgDestPath, vcpkgExe);
    if (!vcpkgUtils.fileExists(vcpkgPath)) {
      console.log(tl.loc('vcpkgNeedsRebuildMissingExecutable'));
      needRebuild = true;
    }
    else {
      if (!vcpkgUtils.isWin32()) {
        tl.execSync('chmod', ["+x", vcpkgPath])
      }
    }

    return needRebuild;
  }

  private async build(): Promise<void> {
    // Build vcpkg.
    let bootstrap: string = 'bootstrap-vcpkg';
    if (vcpkgUtils.isWin32()) {
      bootstrap += '.bat';
    } else {
      bootstrap += '.sh';
    }

    if (vcpkgUtils.isWin32()) {
      let cmdPath: string = tl.which('cmd.exe', true);
      let cmdTool = tl.tool(cmdPath);
      cmdTool.arg(['/c', path.join(this.vcpkgDestPath, bootstrap)]);
      vcpkgUtils.throwIfErrorCode(await cmdTool.exec(this.options));
    } else {
      let shPath: string = tl.which('sh', true);
      let shTool = tl.tool(shPath);
      shTool.arg(['-c', path.join(this.vcpkgDestPath, bootstrap)]);
      vcpkgUtils.throwIfErrorCode(await shTool.exec(this.options));
    }
  }
}
