// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as admZip from 'adm-zip';
import * as tl from 'azure-pipelines-task-lib/task';
import * as trm from 'azure-pipelines-task-lib/toolrunner';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as shell from 'shelljs';
import * as syncRequest from 'sync-request';

// Retrieve the binary directory, which is not deleted at the start of the
// phase.
export function getBinDir(): string {
  let dir: string | undefined = tl.getVariable('Build.BinariesDirectory');
  if (!dir) {
    dir = tl.getVariable('System.ArtifactsDirectory');
  }
  if (!dir) {
    throw new Error(tl.loc(
      'getBinDirFailure',
      'Variables Build.Binaries and System.ArtifactsDirectory are empty'));
  }
  return dir;
}

export const CMAKE_TOOLCHAIN_FILE = "CMAKE_TOOLCHAIN_FILE";
/**
 * Check whether the current generator selected in the command line
 * is -G Ninja.
 * @export
 * @param {string} commandLineString The command line as string
 * @returns {boolean}
 */
export function isNinjaGenerator(commandLineString: string): boolean {
  return /-G[\s]*(\"Ninja\"|Ninja)/.test(commandLineString);
}

export function isMakeProgram(str: string): boolean {
  return /-DCMAKE_MAKE_PROGRAM/.test(str);
}

export function isToolchainFile(str: string): boolean {
  return /-DCMAKE_TOOLCHAIN_FILE/.test(str);
}

export function getToolchainFile(str: string): string | undefined {
  const matches = /-DCMAKE_TOOLCHAIN_FILE(?::[^\s]*)?=([^\s]*)/.exec(str);
  let toolchainFile: string | undefined;

  if (matches != null) {
    if (matches.length > 1) {
      toolchainFile = matches[1];
    }
  }

  return toolchainFile;
}

export function removeToolchainFile(str: string): string {
  str = str.replace(/-DCMAKE_TOOLCHAIN_FILE(:[A-Za-z]+)?=[^\s]+/, "");
  return str;
}

export function shellAssert(): void {
  const errMsg = shell.error();
  if (errMsg) {
    throw new Error('shellAssert: ${errMsg}');
  }
}

export function mkdir(options, target) {
  if (target) {
    shell.mkdir(options, target);
  } else {
    shell.mkdir(options);
  }

  shellAssert();
}

export function rm(options, target) {
  if (target) {
    shell.rm(options, target);
  } else {
    shell.rm(options);
  }

  shellAssert();
}

export function test(options: any, p: any) {
  const result = shell.test(options, p);
  return result;
}

export function downloadFile(url) {
  // validate parameters
  if (!url) {
    throw new Error('downloadFile: Parameter "url" must be set.');
  }

  // skip if already downloaded
  const scrubbedUrl = url.replace(/[/\:?]/g, '_');
  const targetPath = path.join(getBinDir(), 'file', scrubbedUrl);
  const marker = targetPath + '.completed';
  if (!test('-f', marker)) {
    console.log('Downloading file: ' + url);

    // delete any previous partial attempt
    if (test('-f', targetPath)) {
      rm('-f', targetPath);
    }

    // download the file
    mkdir('-p', path.join(getBinDir(), 'file'));
    const result = syncRequest.default('GET', url);
    fs.writeFileSync(targetPath, result.getBody());

    // write the completed marker
    fs.writeFileSync(marker, '');
  }

  return targetPath;
}

export function getSourceDir(): string {
  return tl.getVariable('System.DefaultWorkingDirectory') ?? "";
}

export function isWin32(): boolean {
  return os.platform().toLowerCase() === 'win32';
}

export function isLinux(): boolean {
  return os.platform().toLowerCase() === 'linux';
}

export function isDarwin(): boolean {
  return os.platform().toLowerCase() === 'darwin';
}

export class Downloader {
  static downloadFile(url?: string): string {
    // validate parameters
    if (!url) {
      throw new Error('downloadFile: Parameter "url" must be set.');
    }

    // skip if already downloaded
    const scrubbedUrl = url.replace(/[/\:?]/g, '_');
    const targetPath = path.join(getBinDir(), 'file', scrubbedUrl);
    const marker = targetPath + '.completed';
    if (!test('-f', marker)) {
      console.log('Downloading file: ' + url);

      // delete any previous partial attempt
      if (test('-f', targetPath)) {
        rm('-f', targetPath);
      }

      // download the file
      mkdir('-p', path.join(getBinDir(), 'file'));
      const result = syncRequest.default('GET', url);
      fs.writeFileSync(targetPath, result.getBody());

      // write the completed marker
      fs.writeFileSync(marker, '');
    }

    return targetPath;
  }

  static downloadArchive(url: string): string {
    if (url == null) {
      throw new Error('downloadArchive: url is null!');
    }

    try {
      const cleanedUrl: string = url.replace(/[\/\\:?]/g, '_');
      const targetPath: string =
        path.join(getBinDir(), 'downloads', cleanedUrl);
      const marker: string = targetPath + '.completed';
      if (!test('-f', marker)) {
        // download the whole archive.
        const archivePath = downloadFile(url);
        console.log(`Extracting archive: ${url}`);

        // delete any previously attempted extraction directory
        if (test('-d', targetPath)) {
          rm('-rf', targetPath);
        }

        // extract the archive
        mkdir('-p', targetPath);
        const zip = new admZip(archivePath);
        zip.extractAllTo(targetPath);

        // write the completed file marker
        fs.writeFileSync(marker, '');
      }

      return targetPath;
    } catch (exception) {
      throw new Error(tl.loc('NinjaDownloadArchiveFailed', exception));
    }
  }
}


interface VarMap { [key: string]: string };

function parseVcpkgEnvOutput(data: string): VarMap {
  const map: VarMap = {};
  const regex = {
    param: /^\s*([^=]+?)\s*=\s*(.*?)\s*$/,
  };
  const lines = data.split(/[\r\n]+/);
  const section = null;
  for (const line of lines) {
    if (regex.param.test(line)) {
      const match = line.match(regex.param);
      if (match) {
        map[match[1]] = match[2];
      }
    }
  }

  return map;
}

export function injectEnvVariables(vcpkgRoot: string, triplet: string): void {
  if (!vcpkgRoot) {
    vcpkgRoot = process.env["VCPKG_ROOT"] ?? "";
    if (!vcpkgRoot) {
      throw new Error(tl.loc('VcpkgRootNotSet'));
    }
  }

  // Search for CMake tool and run it
  let vcpkgPath: string = path.join(vcpkgRoot, 'vcpkg');
  if (isWin32()) {
    vcpkgPath += '.exe';
  }
  const vcpkg: trm.ToolRunner = tl.tool(vcpkgPath);
  vcpkg.arg("env");
  vcpkg.arg("--bin");
  vcpkg.arg("--include");
  vcpkg.arg("--tools");
  vcpkg.arg("--python");
  vcpkg.line(`--triplet ${triplet} set`);

  const options = {
    cwd: vcpkgRoot,
    failOnStdErr: false,
    errStream: process.stdout,
    outStream: process.stdout,
    ignoreReturnCode: true,
    silent: false,
    windowsVerbatimArguments: false,
    env: process.env
  } as trm.IExecOptions;

  const output = vcpkg.execSync(options);
  if (output.code != 0) {
    throw new Error(`${output.stdout}\n\n${output.stderr}`);
  }

  const map = parseVcpkgEnvOutput(output.stdout);
  for (const key in map) {
    if (key.toUpperCase() == "PATH") {
      process.env[key] += ";" + map[key];
    } else {
      process.env[key] = map[key];
    }
  }
}

export async function injectVcpkgToolchain(args: string, triplet: string): Promise<string> {
  args = args ?? "";
  const vcpkgRoot: string | undefined = process.env.VCPKG_ROOT;

  // if VCPKG_ROOT is defined, and a toolchain has not been specified,
  // use it!
  if (vcpkgRoot && vcpkgRoot.length > 1) {
    const toolchainFile: string | undefined =
      getToolchainFile(args);
    args = removeToolchainFile(args);
    const vcpkgToolchain: string =
      path.join(vcpkgRoot, '/scripts/buildsystems/vcpkg.cmake');
    args += ` -D${CMAKE_TOOLCHAIN_FILE}="${vcpkgToolchain}"`;
    if (toolchainFile) {
      args += ` -DVCPKG_CHAINLOAD_TOOLCHAIN_FILE="${toolchainFile}"`;
    }

    // If the triplet is provided, specify the same triplet on the cmd line and set the environment for msvc.
    if (triplet) {
      args += ` -DVCPKG_TARGET_TRIPLET=${triplet}`;

      // For Windows build agents, inject the environment variables used
      // for the msvc compiler using the 'vcpkg env' command.
      // This is not be needed for others compiler on Windows, but it should be harmless.
      if (isWin32() && triplet) {
        if (triplet.indexOf("windows") != -1) {
          process.env.CC = "cl.exe";
          process.env.CXX = "cl.exe";
          tl.setVariable("CC", "cl.exe");
          tl.setVariable("CXX", "cl.exe");
        }

        injectEnvVariables(vcpkgRoot, triplet);
      }
    }
  }
  return args;
}

/**
 * Build with cmake.
 * @export
 * @param {string} buildDir
 * @param {string} buildArgs
 * @param {trm.IExecOptions} options
 * @param {string} sourceScript
 * @returns {Promise<void>}
 */
export async function build(buildDir: string, buildArgs: string, options: trm.IExecOptions): Promise<void> {
  // Run cmake with the given arguments
  const cmake: trm.ToolRunner = tl.tool(tl.which('cmake', true));
  cmake.line("--build . " + buildArgs ?? "");

  // Run the command in the build directory
  options.cwd = buildDir;
  console.log(`Building with CMake in build directory '${options.cwd}' ...`);
  const code = await cmake.exec(options);
  if (code != 0) {
    throw new Error(tl.loc('BuildFailed', code));
  }
}

/**
 *  Retrieve the artifacts directory, which is deleted at the start of the build.
 * @export
 * @returns {string}
 */
export function getArtifactsDir(): string {
  let dir: string | undefined = tl.getVariable('Build.ArtifactStagingDirectory');
  if (!dir) {
    dir = tl.getVariable('System.ArtifactsDirectory');
  }
  if (!dir) {
    throw new Error(tl.loc(
      'getBinDirFailure',
      'Variables Build.ArtifactStagingDirectory and System.ArtifactsDirectory are empty'));
  }
  return dir;
}


/**
 * Get a set of commands to be run in the shell of the host OS.
 * @export
 * @param {string[]} args
 * @returns {(trm.ToolRunner | undefined)}
 */
export function getScriptCommand(args: string): trm.ToolRunner | undefined {

  let tool: trm.ToolRunner;
  if (isWin32()) {
    const cmdPath: string = tl.which('cmd.exe', true);
    tool = tl.tool(cmdPath);
    tool.arg('/c');
    tool.line(args);
  } else {
    const shPath: string = tl.which('sh', true);
    tool = tl.tool(shPath);
    tool.arg('-c');
    tool.arg(args);
    return tool;
  }
}
