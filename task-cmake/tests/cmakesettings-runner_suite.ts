// Copyright (c) 2019-2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as assert from 'assert';
import * as settingsRunner from '../../libs/run-cmake-lib/src/cmakesettings-runner'
import * as ifacelib from '../../libs/task-base-lib/src/task-lib';
import * as utils from '../../libs/run-cmake-lib/src/utils'
import * as path from 'path'

// Set the implementation of the BaseLib.
utils.setBaseLib(new ifacelib.TaskLib());

describe('PropertyEvaluator tests', function () {
  it('testing variable evaluation', (done: MochaDone) => {

    const json: any =
    {
      "configurations": [
        {
          "environments": [
            {
              "namespace": "",
              "CONFIGURATION": "Release"
            },
            {
              "namespace": "env",
              "CONFIGURATIONenv": "Releaseenv"
            },
            {
              "CONFIGURATIONnoname": "Releasenoname"
            },
            {
              "environment": "unused",
              "CONFIGURATIONunused": "Releaseunused"
            },
            {
              "environment": "used",
              "namespace": "",
              "CONFIGURATIONused": "Releaseused"
            },
            {
              "environment": "used2",
              "CONFIGURATIONused2": "Releaseused2"
            }
          ],
          "name": "Emscripten Linux Release",
          "generator": "Unix Makefiles",
          "buildRoot": "${projectDir}/build/${name}",
          "installRoot": "${projectDir}/install/${name}",
          "remoteMachineName": "::1",
          "remoteCMakeListsRoot": "$HOME/.vs/${projectDirName}/src/${name}/",
          "cmakeExecutable": "/usr/bin/cmake",
          "remoteBuildRoot": "$HOME/.vs/${projectDirName}/build/${name}/",
          "remoteInstallRoot": "$HOME/.vs/${projectDirName}/install/${name}/",
          "remoteCopySources": true,
          "remoteCopySourcesExclusionList": [".vs", ".git", "out"],
          "remoteCopySourcesOutputVerbosity": "Normal",
          "remoteCopySourcesMethod": "rsync",
          "cmakeCommandArgs": "Release Releaseenv ${env.CONFIGURATIONnoname} ${CONFIGURATIONused} ${env.CONFIGURATIONused2} ${CONFIGURATIONunused}",
          "buildCommandArgs": "VERBOSE=1",
          "ctestCommandArgs": "",
          "inheritEnvironments": ["linux_x64", "used", "used2"]
        }]
    };

    const sourceDir = "/path/projectDirName/";
    const cmakeSettingsJson = path.join(sourceDir, "CMakeSettings.json");
    
    const configurations: settingsRunner.Configuration[] = settingsRunner.parseConfigurations(json, cmakeSettingsJson, sourceDir);
    console.log(`ParsedConfigurations:  ${String(configurations)}`);
    for (const conf of configurations) {
      for (const name in conf.environments) {
        console.log(`'${name}'=${String(conf.environments[name])}`);
      }
    }

    const environmentsMap: settingsRunner.EnvironmentMap = settingsRunner.parseEnvironments(
      [] as any
    )
    const propertiesEval = new settingsRunner.PropertyEvaluator(configurations[0], environmentsMap, new ifacelib.TaskLib());
    const evaluatedConfiguration: settingsRunner.Configuration = configurations[0].evaluate(propertiesEval);

    assert.equal(evaluatedConfiguration.cmakeArgs, "Release Releaseenv Releasenoname Releaseused Releaseused2 ${CONFIGURATIONunused}");
    assert.equal(evaluatedConfiguration.buildDir, `$HOME/.vs/projectDirName/build/Emscripten Linux Release/`)
    done();
  });
});

