// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as tl from 'azure-pipelines-task-lib/task';
import * as trm from 'azure-pipelines-task-lib/toolrunner';
import * as path from 'path';
import { CMakeSettingsJsonRunner } from './cmakesettings-runner'
import * as Globals from './globals';
import * as ninjalib from './ninja';
import * as utils from './utils'

enum TaskModeType {
  Unknown = 0,
  CMakeListsTxtBasic,
  CMakeListsTxtAdvanced,
  CMakeSettingsJson
}

function getTargetType(typeString: string): TaskModeType {
  let type: TaskModeType = TaskModeType.Unknown;
  switch (typeString) {
    case 'CMakeListsTxtBasic': {
      type = TaskModeType.CMakeListsTxtBasic;
      break;
    }
    case 'CMakeListsTxtAdvanced': {
      type = TaskModeType.CMakeListsTxtAdvanced;
      break;
    }
    case 'CMakeSettingsJson': {
      type = TaskModeType.CMakeSettingsJson;
      break;
    }
  }
  return type;
}

const CMakeGenerator = {
  'Unknown': {},
  'VS16Arm': { 'G': 'Visual Studio 16 2019', 'A': 'ARM' },
  'VS16Win32': { 'G': 'Visual Studio 16 2019', 'A': 'Win32' },
  'VS16Win64': { 'G': 'Visual Studio 16 2019', 'A': 'x64' },
  'VS16Arm64': { 'G': 'Visual Studio 16 2019', 'A': 'ARM64' },
  'VS15Arm': { 'G': 'Visual Studio 15 2017', 'A': 'ARM' },
  'VS15Win32': { 'G': 'Visual Studio 15 2017', 'A': 'Win32' },
  'VS15Win64': { 'G': 'Visual Studio 15 2017', 'A': 'x64' },
  'VS15Arm64': { 'G': 'Visual Studio 15 2017', 'A': 'ARM64' },
  'Ninja': { 'G': 'Ninja', 'A': '' },
  'UnixMakefiles': { 'G': 'Unix Makefiles', 'A': '' }
};
function getGenerator(generatorString: string): any {
  return CMakeGenerator[generatorString]
}

export class CMakeRunner {
  buildDir: string;
  appendedArgs: string;
  configurationFilter: string;
  ninjaPath: string;
  ninjaDownloadUrl: string;
  taskMode: TaskModeType = TaskModeType.Unknown;
  cmakeSettingsJsonPath: string;
  cmakeListsTxtPath: string;
  generator: any = {};
  cmakeToolchainPath: string;
  doBuild: boolean;
  doBuildArgs: string;
  cmakeSourceDir: string;
  useVcpkgToolchainFile: boolean;
  cmakeBuildType: string;
  vcpkgTriplet: string;
  sourceScript: string;

  constructor() {
    // Nothing to do.
  }

  fetchInput(): void {
    tl.debug('fetchInput()<<');
    const mode: string = tl.getInput(Globals.cmakeListsOrSettingsJson, true) ?? "";
    this.taskMode = getTargetType(mode);
    if (this.taskMode == TaskModeType.Unknown || !this.taskMode) {
      throw new Error(`fetchInput(): ${tl.loc('InvalidTaskMode')}`);
    }

    this.cmakeSettingsJsonPath = tl.getPathInput(
      Globals.cmakeSettingsJsonPath,
      this.taskMode == TaskModeType.CMakeSettingsJson) ?? "";
    this.cmakeListsTxtPath = tl.getPathInput(
      Globals.cmakeListsTxtPath,
      this.taskMode == TaskModeType.CMakeListsTxtBasic) ?? "";
    this.buildDir = tl.getInput(
      Globals.buildDirectory,
      this.taskMode == TaskModeType.CMakeListsTxtBasic) ?? "";
    this.appendedArgs = tl.getInput(
      Globals.cmakeAppendedArgs,
      false) ?? "";
    this.configurationFilter = tl.getInput(
      Globals.configurationRegexFilter,
      this.taskMode == TaskModeType.CMakeSettingsJson) ?? "";
    this.ninjaPath = '';
    if (tl.filePathSupplied(Globals.ninjaPath)) {
      this.ninjaPath = tl.getInput(Globals.ninjaPath, false) ?? "";
    }
    if (tl.filePathSupplied(Globals.cmakeToolchainPath)) {
      this.cmakeToolchainPath = tl.getInput(Globals.cmakeToolchainPath, false) ?? "";
    }
    const gen: string = tl.getInput(
      Globals.cmakeGenerator,
      this.taskMode == TaskModeType.CMakeListsTxtBasic) ?? "";
    this.generator = getGenerator(gen);
    this.ninjaDownloadUrl = tl.getInput(Globals.ninjaDownloadUrl, false) ?? "";
    this.doBuild = tl.getBoolInput(Globals.buildWithCMake, false) ?? false;
    this.doBuildArgs = tl.getInput(Globals.buildWithCMakeArgs, false) ?? '';
    this.cmakeSourceDir = path.dirname(this.cmakeListsTxtPath ?? '');

    this.useVcpkgToolchainFile =
      tl.getBoolInput(Globals.useVcpkgToolchainFile, false);

    this.cmakeBuildType = tl.getInput(
      Globals.cmakeBuildType,
      this.taskMode == TaskModeType.CMakeListsTxtBasic) ?? "";

    this.vcpkgTriplet = tl.getInput(Globals.vcpkgTriplet, false) ?? "";

    this.sourceScript = tl.getInput(Globals.cmakeWrapperCommand, false) ?? "";
  }

  async run(): Promise<void> {
    tl.debug('run()<<');
    tl.debug(tl.loc('TaskStarting'));

    this.fetchInput();
    await this.configure();
  }

  async configure(): Promise<void> {
    tl.debug('configure()<<')
    let cmakeArgs = ' ';

    switch (this.taskMode) {
      default:
      case TaskModeType.Unknown: {
        throw new Error(tl.loc('InvalidTaskMode'));
      }

      case TaskModeType.CMakeListsTxtAdvanced:
      case TaskModeType.CMakeListsTxtBasic: {
        // Search for CMake tool and run it
        let cmake: trm.ToolRunner;
        if (this.sourceScript) {
          cmake = tl.tool(this.sourceScript);
          cmakeArgs += tl.which('cmake', true);
        }
        else {
          cmake = tl.tool(tl.which('cmake', true));
        }

        if (this.taskMode == TaskModeType.CMakeListsTxtAdvanced) {
          cmakeArgs = this.appendedArgs;

          // If Ninja is required, specify the path to it.
          if (utils.isNinjaGenerator(cmakeArgs)) {
            if (!utils.isMakeProgram(cmakeArgs)) {
              const ninjaPath: string = ninjalib.retrieveNinjaPath(this.ninjaPath);
              cmakeArgs += ` -DCMAKE_MAKE_PROGRAM="${ninjaPath}"`;
            }
          }
        } else if (this.taskMode == TaskModeType.CMakeListsTxtBasic) {
          const generatorName = this.generator['G'];
          const generatorArch = this.generator['A'];
          cmakeArgs = ` -G "${generatorName}"`;
          if (generatorArch) {
            cmakeArgs += ` -A ${generatorArch}`;
          }
          if (generatorName == CMakeGenerator['Ninja']['G']) {
            const ninjaPath: string = ninjalib.retrieveNinjaPath(this.ninjaPath);
            cmakeArgs += ` -DCMAKE_MAKE_PROGRAM="${ninjaPath}"`;
          }

          if (this.cmakeToolchainPath) {
            cmakeArgs += ` -D${utils.CMAKE_TOOLCHAIN_FILE}="${this.cmakeToolchainPath}"`;
          }

          // Add build type.
          cmakeArgs += ` -DCMAKE_BUILD_TYPE=${this.cmakeBuildType}`;
        }

        // Use vcpkg toolchain if requested.
        if (this.useVcpkgToolchainFile === true) {
          cmakeArgs = await utils.injectVcpkgToolchain(cmakeArgs, this.vcpkgTriplet)
        }

        // The source directory is required for any mode.
        cmakeArgs += ` ${this.cmakeSourceDir}`;

        tl.debug(`CMake arguments: ${cmakeArgs}`);

        // Ensure the build directory is existing.
        tl.mkdirP(this.buildDir);
        cmake.line(cmakeArgs);

        const options = {
          cwd: this.buildDir,
          failOnStdErr: false,
          errStream: process.stdout,
          outStream: process.stdout,
          ignoreReturnCode: true,
          silent: false,
          windowsVerbatimArguments: false,
          env: process.env
        } as trm.IExecOptions;

        tl.debug(`Generating project files with CMake in build directory '${options.cwd}' ...`);
        const code: number = await cmake.exec(options);
        if (code != 0) {
          throw new Error(tl.loc("CMakeFailed", code));
        }

        if (this.doBuild) {
          await utils.build(this.buildDir, this.doBuildArgs, options);
        }

        break;
      }

      case TaskModeType.CMakeSettingsJson: {
        const cmakeJson: CMakeSettingsJsonRunner = new CMakeSettingsJsonRunner(
          this.cmakeSettingsJsonPath, this.configurationFilter,
          this.appendedArgs, utils.getSourceDir(), this.vcpkgTriplet,
          this.useVcpkgToolchainFile, this.doBuild, this.ninjaPath, this.sourceScript,
          this.buildDir);
        await cmakeJson.run();
        break;
      }
    }
  }
}
