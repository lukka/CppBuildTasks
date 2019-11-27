// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT


import * as path from 'path';
import * as vcpkgUtils from './vcpkg-utils'
import { IBaseLib, IExecOptions, IExecResult } from "./base-lib";
import { Globals } from './globals';


export class VcpkgRunner {
  vcpkgDestPath: string;
  vcpkgArgs: string;
  defaultVcpkgUrl: string;
  vcpkgURL: string;

  public constructor(private tl: IBaseLib) { }

  /**
   * Git ref (a branch, a tag, or a commit id) to fetch from the vcpkg repository.
   * @type {string} The ref name (e.g. the branch or tag name or id).
   * @memberof VcpkgRunner
   */
  vcpkgCommitId: string;
  vcpkgTriplet: string;
  options: IExecOptions;
  vcpkgArtifactIgnoreEntries: string[];

  private fetchInput(): void {
    this.vcpkgArgs = this.tl.getInput(Globals.vcpkgArguments, true) ?? "";
    this.defaultVcpkgUrl = 'https://github.com/microsoft/vcpkg.git';
    this.vcpkgURL =
      this.tl.getInput(Globals.vcpkgGitURL, false) ?? this.defaultVcpkgUrl;
    this.vcpkgCommitId =
      this.tl.getInput(Globals.vcpkgCommitId, false) ?? 'master';
    this.vcpkgDestPath = this.tl.getPathInput(Globals.vcpkgDirectory) ?? "";
    if (!this.vcpkgDestPath) {
      this.vcpkgDestPath = path.join(vcpkgUtils.getBinDir(), 'vcpkg');
    }

    this.vcpkgTriplet = this.tl.getInput(Globals.vcpkgTriplet, false) ?? "";
    this.vcpkgArtifactIgnoreEntries = this.tl.getDelimitedInput(Globals.vcpkgArtifactIgnoreEntries, '\n', false);
  }

  async run(): Promise<void> {
    this.tl.debug(this.tl.loc('TaskStarting'));
    this.fetchInput();
    // Override the VCPKG_ROOT value, it must point to this vcpkg instance.
    vcpkgUtils.setEnvVar(vcpkgUtils.vcpkgRootEnvName, this.vcpkgDestPath);
    console.log(`Set task output variable '${Globals.outVcpkgRootPath}' to value: ${
      this.vcpkgDestPath}`);
    this.tl.setVariable(Globals.outVcpkgRootPath, this.vcpkgDestPath);

    // Force AZP_CACHING_CONTENT_FORMAT to "Files"
    vcpkgUtils.setEnvVar(vcpkgUtils.cachingFormatEnvName, "Files");

    this.options = <IExecOptions>{
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
    const artifactignoreFile: string = '.artifactignore';
    const artifactFullPath: string = path.join(this.vcpkgDestPath, artifactignoreFile);
    let [ok, content] = vcpkgUtils.readFile(artifactFullPath);
    content = ok ? content + "\n" : "";
    vcpkgUtils.writeFile(artifactFullPath,
      content + this.vcpkgArtifactIgnoreEntries.join('\n'));
  }

  private async updatePackages(): Promise<void> {
    let vcpkgPath: string = path.join(this.vcpkgDestPath, 'vcpkg');
    if (vcpkgUtils.isWin32()) {
      vcpkgPath += '.exe';
    }

    // vcpkg remove --outdated --recurse
    const removeCmd = 'remove --outdated --recurse';
    let vcpkgTool = this.tl.tool(vcpkgPath);
    console.log(
      `Running 'vcpkg ${removeCmd}' in directory '${this.vcpkgDestPath}' ...`);
    vcpkgTool.line(removeCmd);
    vcpkgUtils.throwIfErrorCode(await vcpkgTool.exec(this.options));

    // vcpkg install --recurse <list of packages>
    vcpkgTool = this.tl.tool(vcpkgPath);
    let installCmd: string = `install --recurse ${this.vcpkgArgs}`;

    // Extract triplet from arguments for vcpkg.
    const extractedTriplet: string | null = vcpkgUtils.extractTriplet(installCmd, vcpkgUtils.readFile);
    // Append triplet, only if provided by the user in the task arguments
    if (extractedTriplet !== null) {
      if (this.vcpkgTriplet) {
        this.tl.warning(`Ignoring the task provided triplet: '${this.vcpkgTriplet}'.`);
      }
      this.vcpkgTriplet = extractedTriplet;
      console.log(`Extracted triplet from command line '${this.vcpkgTriplet}'.`);
    } else {
      // If triplet is nor specified in arguments, nor in task, let's deduce it from
      // agent context (i.e. its OS).
      if (!this.vcpkgTriplet) {
        console.log("No '--triplet' argument is provided on the command line to vcpkg.");
      }
      else {
        console.log(`Using triplet '${this.vcpkgTriplet}'.`);

        // Add the triplet argument to the command line.
        installCmd += ` --triplet ${this.vcpkgTriplet}`;
      }
    }

    if (this.vcpkgTriplet) {
      // Set the used triplet in VCPKG_TRIPLET environment variable
      process.env['VCPKG_TRIPLET'] = this.vcpkgTriplet;

      // Set the user specified triplet in VCPKG_TRIPLET task variable
      this.tl.setVariable("VCPKG_TRIPLET", this.vcpkgTriplet);

      // Set output variable containing the use triplet
      console.log(`Set task output variable '${Globals.outVcpkgTriplet}' to value: ${
        this.vcpkgTriplet}`);
      this.tl.setVariable(Globals.outVcpkgTriplet, this.vcpkgTriplet);
    }
    else {
      console.log(`No 'outvcpkgTriplet' nor 'VCPKG_TRIPLET' has been set by the task as there is no default triplet specified.`);
    }

    vcpkgTool.line(installCmd);
    console.log(
      `Running 'vcpkg ${installCmd}' in directory '${this.vcpkgDestPath}' ...`);
    vcpkgUtils.throwIfErrorCode(await vcpkgTool.exec(this.options));
  }

  private async updateRepo(): Promise<boolean> {
    let gitPath: string = await this.tl.which('git', true);
    // Git update or clone depending on content of vcpkgDestPath.
    const cloneCompletedFilePath = path.join(this.vcpkgDestPath, Globals.vcpkgRemoteUrlLastFileName);

    // Update the source of vcpkg if needed.
    let updated: boolean = false;
    let needRebuild: boolean = false;
    const remoteUrlAndCommitId: string = this.vcpkgURL + this.vcpkgCommitId;
    const isSubmodule = await vcpkgUtils.isVcpkgSubmodule(gitPath, this.vcpkgDestPath);
    if (isSubmodule) {
      // In case vcpkg it is a Git submodule...
      console.log(`'vcpkg' is detected as a submodule, adding '.git' to the ignored entries in '.artifactignore' file (for excluding it from caching).`);
      // Remove any existing '!.git'.
      this.vcpkgArtifactIgnoreEntries =
        this.vcpkgArtifactIgnoreEntries.filter(item => !item.trim().endsWith('!.git'));
      // Add '.git' to ignore that directory.
      this.vcpkgArtifactIgnoreEntries.push('.git');
      console.log(`.artifactsignore content: '${this.vcpkgArtifactIgnoreEntries.map(s => `"${s}"`).join(', ')}'`);
      updated = true;
    }

    let res: boolean = vcpkgUtils.directoryExists(this.vcpkgDestPath);
    this.tl.debug(`exist('${this.vcpkgDestPath}') == ${res}`);
    if (res && !isSubmodule) {
      let [ok, remoteUrlAndCommitIdLast] = vcpkgUtils.readFile(cloneCompletedFilePath);
      this.tl.debug(`cloned check: ${ok}, ${remoteUrlAndCommitIdLast}`);
      if (ok) {
        this.tl.debug(`lastcommitid=${remoteUrlAndCommitIdLast}, actualcommitid=${remoteUrlAndCommitId}`);
        if (remoteUrlAndCommitIdLast == remoteUrlAndCommitId) {
          // Update from remote repository.
          this.tl.debug(`options.cwd=${this.options.cwd}`);
          vcpkgUtils.throwIfErrorCode(await this.tl.exec(gitPath, ['remote', 'update'], this.options));
          // Use git status to understand if we need to rebuild vcpkg since the last cloned 
          // repository is not up to date.
          let res: IExecResult = await this.tl.execSync(gitPath, ['status', '-uno'], this.options);
          let uptodate = res.stdout.match("up to date");
          let detached = res.stdout.match("detached");
          if (!uptodate && !detached) {
            // Update sources and force a rebuild.
            vcpkgUtils.throwIfErrorCode(await this.tl.exec(gitPath, ['pull', 'origin', this.vcpkgCommitId], this.options));
            needRebuild = true;
            console.log(this.tl.loc('vcpkgNeedsRebuildRepoUpdated'));
          }
          updated = true;
        }
      }
    }

    // Git clone.
    if (!updated) {
      needRebuild = true;
      this.tl.rmRF(this.vcpkgDestPath);
      this.tl.mkdirP(this.vcpkgDestPath);
      this.tl.cd(this.vcpkgDestPath);

      let gitTool = this.tl.tool(gitPath);

      gitTool = this.tl.tool(gitPath);
      gitTool.arg(['clone', this.vcpkgURL, '-n', '.']);
      vcpkgUtils.throwIfErrorCode(await gitTool.exec(this.options));

      gitTool = this.tl.tool(gitPath);
      gitTool.arg(['checkout', '--force', this.vcpkgCommitId]);
      vcpkgUtils.throwIfErrorCode(await gitTool.exec(this.options));

      this.tl.writeFile(cloneCompletedFilePath, remoteUrlAndCommitId);
    }

    // If the executable file ./vcpkg/vcpkg is not present, force build. The fact that the repository
    // is up to date is meaningless.
    const vcpkgExe: string = vcpkgUtils.isWin32() ? "vcpkg.exe" : "vcpkg"
    const vcpkgPath: string = path.join(this.vcpkgDestPath, vcpkgExe);
    if (!vcpkgUtils.fileExists(vcpkgPath)) {
      console.log(this.tl.loc('vcpkgNeedsRebuildMissingExecutable'));
      needRebuild = true;
    } else {
      if (!vcpkgUtils.isWin32()) {
        this.tl.execSync('chmod', ["+x", vcpkgPath])
      }
    }

    return needRebuild;
  }

  private async build(): Promise<void> {
    // Build vcpkg.
    let bootstrapFileName: string = 'bootstrap-vcpkg';
    if (vcpkgUtils.isWin32()) {
      bootstrapFileName += '.bat';
    } else {
      bootstrapFileName += '.sh';
    }

    if (vcpkgUtils.isWin32()) {
      let cmdPath: string = await this.tl.which('cmd.exe', true);
      let cmdTool = this.tl.tool(cmdPath);
      cmdTool.arg(['/c', path.join(this.vcpkgDestPath, bootstrapFileName)]);
      vcpkgUtils.throwIfErrorCode(await cmdTool.exec(this.options));
    } else {
      const shPath: string = await this.tl.which('sh', true);
      const shTool = this.tl.tool(shPath);
      const bootstrapFullPath: string = path.join(this.vcpkgDestPath, bootstrapFileName);
      if (!vcpkgUtils.isWin32()) {
        this.tl.execSync('chmod', ["+x", bootstrapFullPath]);
      }
      shTool.arg(['-c', bootstrapFullPath]);
      vcpkgUtils.throwIfErrorCode(await shTool.exec(this.options));
    }
  }
}
