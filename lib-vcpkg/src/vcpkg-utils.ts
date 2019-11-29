// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as fs from 'fs';
import * as os from 'os';
import * as ifacelib from './base-lib'

let taskLib: ifacelib.BaseLib;

export const vcpkgRootEnvName = 'VCPKG_ROOT';
export const cachingFormatEnvName = 'AZP_CACHING_CONTENT_FORMAT';

export function setIBaseLib(tl: ifacelib.BaseLib) {
  taskLib = tl;
}

// Retrieve the binary directory, which is not deleted at the start of the
// phase.
export function getBinDir(): string {
  let dir: string = taskLib.getVariable('Build.BinariesDirectory') ?? "";
  if (!dir) {
    dir = taskLib.getVariable('System.ArtifactsDirectory') ?? "";
  }
  if (!dir) {
    throw new Error(taskLib.loc(
      'vcpkGetBinDirFailure',
      'Variables Build.Binaries and System.ArtifactsDirectory are both empty'));
  }
  return dir;
}

export async function isVcpkgSubmodule(gitPath: string, fullVcpkgPath: string): Promise<boolean> {
  try {
    const options: ifacelib.ExecOptions = {
      cwd: process.env.BUILD_SOURCESDIRECTORY,
      failOnStdErr: false,
      errStream: process.stdout,
      outStream: process.stdout,
      ignoreReturnCode: true,
      silent: false,
      windowsVerbatimArguments: false,
      env: process.env
    } as ifacelib.ExecOptions;

    const res: ifacelib.ExecResult = await taskLib.execSync(gitPath, ['submodule', 'status', fullVcpkgPath], options);
    let isSubmodule = false;
    if (res.error !== null) {
      isSubmodule = res.code == 0;
      let msg: string;
      msg = `'git submodule ${fullVcpkgPath}': exit code='${res.code}' `;
      if (res.stdout !== null) {
        msg += `, stdout='${res.stdout.trim()}'`;
      }
      if (res.stderr !== null) {
        msg += `, stderr='${res.stderr.trim()}'`;
      }
      msg += '.';

      taskLib.debug(msg);
    }

    return isSubmodule;
  }
  catch (error) {
    taskLib.warning(`ïsVcpkgSubmodule() failed: ${error}`);
    return false;
  }
}

export function throwIfErrorCode(errorCode: number): void {
  if (errorCode != 0) {
    taskLib.error(taskLib.loc('commandFailed', errorCode));
    throw new Error(taskLib.loc('commandFailed', errorCode));
  }
}

export function isWin32(): boolean {
  return os.platform().toLowerCase() === 'win32';
}

export function isMacos(): boolean {
  return os.platform().toLowerCase() === 'darwin';
}

// freeBSD or openBSD
export function isBSD(): boolean {
  return os.platform().toLowerCase().indexOf("bsd") != -1;
}

export function isLinux(): boolean {
  return os.platform().toLowerCase() === 'linux';
}

export function isDarwin(): boolean {
  return os.platform().toLowerCase() === 'Darwin';
}

export function directoryExists(path: string) {
  try {
    return taskLib.stats(path).isDirectory();
  } catch (error) {
    taskLib.debug(`directoryExists(${path}): ${"" + error}`);
    return false;
  }
}

export function fileExists(path: string) {
  try {
    return taskLib.stats(path).isFile();
  } catch (error) {
    taskLib.debug(`fileExists(${path}): ${"" + error}`);
    return false;
  }
}

export function readFile(path: string): [boolean, string] {
  try {
    const readString: string = fs.readFileSync(path, { encoding: 'utf8', flag: 'r' });
    taskLib.debug(`readFile(${path})='${readString}'.`);
    return [true, readString];
  } catch (error) {
    taskLib.debug(`readFile(${path}): ${"" + error}`);
    return [false, error];
  }
}

export function writeFile(file: string, content: string): void {
  taskLib.debug(`Writing to file '${file}' content '${content}'.`);
  taskLib.writeFile(file, content);
}

export function getDefaultTriplet(): string {
  const envVar = process.env["VCPKG_DEFAULT_TRIPLET"];
  if (envVar) {
    return envVar;
  }
  else {
    if (isWin32()) {
      return "x86-windows";
    }
    else if (isLinux()) {
      return "x64-linux";
    }
    else if (isMacos()) {
      return "x64-osx";
    }
    else if (isBSD()) {
      return "x64-freebsd";
    }
  }
  return "";
}

export function extractTriplet(args: string, readFile: (string) => [boolean, string]): string | null {
  let triplet: string | null = null;
  // Split string on any 'whitespace' character
  const argsSplitted: string[] = args.split(/\s/).filter((a) => a.length != 0);
  let index = 0;
  for (; index < argsSplitted.length; index++) {
    let arg: string = argsSplitted[index].trim();
    // remove all whitespace characters (e.g. newlines, tabs, blanks)
    arg = arg.replace(/\s/, '')
    if (arg === "--triplet") {
      index++;
      if (index < argsSplitted.length) {
        triplet = argsSplitted[index];
        return triplet.trim();
      }
    }
    if (arg.startsWith("@")) {
      const [ok, content] = readFile(arg.substring(1));
      if (ok) {
        const t = this.extractTriplet(content);
        if (t) {
          return t.trim();
        }
      }
    }
  }
  return triplet;
}

export function resolveArguments(args: string, readFile: (string) => [boolean, string]): string {
  let resolvedArguments = "";

  // Split string on any 'whitespace' character
  const argsSplitted: string[] = args.split(/\s/).filter((a) => a.length != 0);
  let index = 0;
  for (; index < argsSplitted.length; index++) {
    let arg: string = argsSplitted[index].trim();
    // remove all whitespace characters (e.g. newlines, tabs, blanks)
    arg = arg.replace(/\s/, '');
    let isResponseFile = false;
    if (arg.startsWith("@")) {
      const resolvedFilePath: string = taskLib.resolve(arg);
      if (taskLib.exist(resolvedFilePath)) {
        const [ok, content] = readFile(resolvedFilePath);
        if (ok && content) {
          isResponseFile = true;
          resolvedArguments += content;
        }
      }
    }

    if (!isResponseFile) {
      resolvedArguments += arg;
    }
  }

  return resolvedArguments;
}

// Force 'name' env variable to have value of 'value'.
export function setEnvVar(name: string, value: string) {
  process.env[name] = value;
  taskLib.setVariable(name, value);
  taskLib.debug(`Env var '${name}' set to value '${value}'.`);
}
