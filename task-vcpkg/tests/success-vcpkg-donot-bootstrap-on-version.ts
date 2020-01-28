// Copyright (c) 2019-2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as ma from 'azure-pipelines-task-lib/mock-answer';
import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';
import * as vcpkgUtilsMock from './vcpkg-utils-mock';
import * as assert from 'assert';

import * as globals from '../../libs/run-vcpkg-lib/src/vcpkg-globals'

const taskPath = path.join(__dirname, '..', 'src', 'vcpkg-task.js');
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

const gitPath = '/usr/local/bin/git';
const gitRef = 'samegitref';
const vcpkgRoot = '/path/to/vcpkg';
const getVcpkgExeName = function (): string { return vcpkgUtilsMock.utilsMock.isWin32() ? "vcpkg.exe" : "vcpkg" };
const vcpkgExeName = getVcpkgExeName();
const vcpkgExePath = path.join(vcpkgRoot, vcpkgExeName);

const answers: ma.TaskLibAnswers = {
  'which': {
    'git': gitPath, 'sh': '/bin/bash', 'chmod': '/bin/chmod', [vcpkgExePath]: vcpkgExePath
  },
  'checkPath': {
    [gitPath]: true, '/bin/bash': true, '/bin/chmod': true, [vcpkgExePath]: true
  },
  'exec': {
    [`/bin/chmod +x ${path.join(vcpkgRoot, vcpkgExeName)}`]: { 'code': 0, 'stdout': 'chmod output here\n' },
    [gitPath]: { 'code': 0, 'stdout': 'git output here\n' },
    [`${gitPath} submodule`]:
      { 'code': 0, 'stdout': 'this is git submodule output\n' },
    [`${vcpkgExePath} install --recurse vcpkg_args`]:
      { 'code': 0, 'stdout': 'this is the vcpkg output\n' },
    [`${vcpkgExePath} remove --outdated --recurse`]:
      { 'code': 0, 'stdout': 'this is the vcpkg remove output\n' },
    [`/bin/bash -c ${vcpkgRoot}/bootstrap-vcpkg.sh`]:
      { 'code': 0, 'stdout': 'this is the output of bootstrap-vcpkg\n' },
    [`/bin/chmod +x ${vcpkgRoot}/bootstrap-vcpkg.sh`]:
      { 'code': 0, 'stdout': 'this is the output of chmod +x bootstrap\n' },
    [`${gitPath} rev-parse HEAD`]:
      { 'code': 0, 'stdout': gitRef },
  },
  'rmRF': { [`${vcpkgRoot}`]: { success: true } }
} as ma.TaskLibAnswers;

// Arrange
vcpkgUtilsMock.utilsMock.readFile = (file: string): [boolean, string] => {
  if (file == `${vcpkgRoot}/.artifactignore`) {
    return [true, "tokeep1"];
  }
  else if (file == `${vcpkgRoot}/${globals.vcpkgLastBuiltCommitId}`) {
    return [true, gitRef];
  }
  else
    throw `readFile called with unexpected file name: ${file}`;
};
vcpkgUtilsMock.utilsMock.writeFile = (file: string, content: string): void => {
  console.log(`Writing to file '${file}' content '${content}'`);
  if (file.endsWith('.artifactignore')) {
    assert.ok(content.indexOf('!.git') === -1, "There must be no !.git .");
    const entries: string[] = [".git", "entrytokeep1"];
    for (const entry of entries)
      assert.ok(content.indexOf(entry) !== -1, `There must be '${entry}' .`);
  }
};
vcpkgUtilsMock.utilsMock.getVcpkgExePath = (vcpkgRoot: string): string => {
  return vcpkgExePath;
}
vcpkgUtilsMock.utilsMock.isVcpkgSubmodule = (): boolean => {
  return true;
};
tmr.registerMock('./vcpkg-utils', vcpkgUtilsMock.utilsMock);

tmr.registerMock('strip-json-comments', {
  stripJsonComments(str: string): string {
    return str;
  }
});

tmr.setAnswers(answers);
tmr.setInput(globals.vcpkgArguments, 'vcpkg_args');
tmr.setInput(globals.vcpkgArtifactIgnoreEntries, 'entrytokeep1');

// Act
tmr.run();

// Assert
// Asserts are in _suite.ts where this test case in invoked.