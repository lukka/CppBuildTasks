// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as tl from 'azure-pipelines-task-lib/task';
import * as path from 'path';

import * as utils from './utils';

export function findNinjaTool(): string {
  const ninjaPath = tl.which('ninja', false);
  return ninjaPath;
};

export class NinjaDownloader {
  static baseUrl =
    'https://github.com/ninja-build/ninja/releases/download/v1.9.0';

  static download(url: string | null): string {
    let ninjaPath = '';
    const defaultUrl = '';
    if (!url) {
      if (utils.isLinux()) {
        url = `${NinjaDownloader.baseUrl}/ninja-linux.zip`;
      } else if (utils.isDarwin()) {
        url = `${NinjaDownloader.baseUrl}/ninja-mac.zip`;
      } else if (utils.isWin32()) {
        url = `${NinjaDownloader.baseUrl}/ninja-win.zip`;
      }
    }

    // Create the name of the executable, i.e. ninja or ninja.exe .
    let ninjaExeName = 'ninja';
    if (utils.isWin32()) {
      ninjaExeName += ".exe";
    }

    ninjaPath = utils.Downloader.downloadArchive(url!);
    ninjaPath = path.join(ninjaPath, ninjaExeName);
    if (utils.isLinux() || utils.isDarwin()) {
      tl.exec('chmod', `+x ${ninjaPath}`);
    }

    return ninjaPath;
  }
}

export function retrieveNinjaPath(ninjaPath: string): string {
  if (!ninjaPath) {
    tl.debug(tl.loc('NinjaPathNotSpecified'));

    ninjaPath = findNinjaTool();
    if (!ninjaPath) {
      tl.debug(tl.loc('NinjaNotInPath'));
      ninjaPath =
        NinjaDownloader.download(this.ninjaDownloadUrl);
      if (!ninjaPath) {
        throw new Error(tl.loc('NinjaNotFound'));
      }
    }
  }
  return ninjaPath;
}

