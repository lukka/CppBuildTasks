import * as tl from 'azure-pipelines-task-lib/task';
import * as fs from 'fs';
import * as os from 'os';

// Retrieve the binary directory, which is not deleted at the start of the
// phase.
export function getBinDir(): string {
  let dir: string = tl.getVariable('Build.BinariesDirectory');
  if (!dir) {
    dir = tl.getVariable('System.ArtifactsDirectory');
  }
  if (!dir) {
    throw new Error(tl.loc(
      'vcpkGetBinDirFailure',
      'Variables Build.Binaries and System.ArtifactsDirectory are empty'));
  }
  return dir;
}

export function throwIfErrorCode(errorCode: Number): void {
  if (errorCode != 0) {
    tl.error(tl.loc('commandFailed', errorCode));
    throw new Error(tl.loc('commandFailed', errorCode));
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
    return tl.stats(path).isDirectory();
  } catch (error) {
    tl.debug(`directoryExists(${path}): ${"" + error}`);
    return false;
  }
}

export function fileExists(path: string) {
  try {
    return tl.stats(path).isFile();
  } catch (error) {
    tl.debug(`fileExists(${path}): ${"" + error}`);
    return false;
  }
}

export function readFile(path: string): [boolean, string] {
  try {
    return [true, fs.readFileSync(path, { encoding: 'utf8', flag: 'r' })];
  } catch (error) {
    tl.debug(`readFile(${path}): ${"" + error}`);
    return [false, error];
  }
}

export function getDefaultTriplet(): string {
  let envVar = process.env["VCPKG_DEFAULT_TRIPLET"];
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
  let argsSplitted: string[] = args.split(/\s/).filter((a) => a.length != 0);
  let index: number = 0;
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
      let [ok, content] = readFile(arg.substring(1));
      if (ok) {
        let t = this.extractTriplet(content);
        if (t) {
          return t.trim();
        }
      }
    }
  }
  return triplet;
}

