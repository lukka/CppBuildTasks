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

const json: any =
{
  "environments": [
    { "environment": "", "emptyNameGlobalVarName": "emptyNameGlobalVarValue" },
    { "noNameGlobalVarName": "noNameGlobalVarValue" },
    { "environment": "env", "envGlobalVarName": "envGlobalVarValue" },
    { "environment": "customEnv", "customEnvVarName": "customEnvVarValue" }
  ],
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
    },
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
      "name": "Windows Release",
      "generator": "Ninja",
      "buildRoot": "${projectDir}/build/${name}",
      "installRoot": "${projectDir}/install/${name}",
      "cmakeCommandArgs": "Release Releaseenv ${env.CONFIGURATIONnoname} ${CONFIGURATIONused} ${env.CONFIGURATIONused2} ${CONFIGURATIONunused}",
      "buildCommandArgs": "VERBOSE=1",
      "ctestCommandArgs": "",
      "inheritEnvironments": ["msvc_x64", "used", "used2", "customEnv"]
    }]
};

describe('PropertyEvaluator tests', function () {
  it('testing variable evaluation and environment variables (remote configuration)', (done: MochaDone) => {
    const sourceDir = "/path/projectDirName/";
    const cmakeSettingsJson = path.join(sourceDir, "CMakeSettings.json");

    const configurations: settingsRunner.Configuration[] = settingsRunner.parseConfigurations(json.configurations, cmakeSettingsJson, sourceDir);
    console.log(`Parsed configurations:  ${String(configurations)}`);
    for (const conf of configurations) {
      for (const name in conf.environments) {
        console.log(`'${name}'=${String(conf.environments[name])}`);
      }
    }
    const confUnderTest: settingsRunner.Configuration = configurations[0];

    const environmentsMap: settingsRunner.EnvironmentMap = settingsRunner.parseEnvironments(
      json.environments
    )
    const propertiesEval = new settingsRunner.PropertyEvaluator(confUnderTest, environmentsMap, new ifacelib.TaskLib());

    const evaluatedConfiguration: settingsRunner.Configuration = confUnderTest.evaluate(propertiesEval);
    evaluatedConfiguration.setEnvironment(environmentsMap);

    // Assert on evaluation.
    assert.equal(evaluatedConfiguration.buildDir, "$HOME/.vs/projectDirName/build/Emscripten Linux Release/", "buildDir must be right");
    assert.equal(evaluatedConfiguration.cmakeArgs, "Release Releaseenv Releasenoname Releaseused Releaseused2 ${CONFIGURATIONunused}", "cmake args must be right");
    assert.equal(evaluatedConfiguration.generator, "Unix Makefiles", "cmake generator must be right");

    // Asserts on environments.
    assert.equal(process.env["CONFIGURATIONenv"], "Releaseenv");
    assert.equal(process.env["CONFIGURATIONnoname"], "Releasenoname");
    assert.equal(process.env["envGlobalVarName"], "envGlobalVarValue");
    // Environment without a name are automatically inherited by any configuration.
    assert.equal(process.env["noNameGlobalVarName"], "noNameGlobalVarValue");
    assert.equal(process.env["emptyNameGlobalVarName"], "emptyNameGlobalVarValue");
    assert.ok(!process.env["customEnvVarName"], "customEnvVarName must not be defined, as it is not inherited");
    done();
  });

  it('testing variable evaluation and environment variables (local configuration)', (done: MochaDone) => {
    const sourceDir = "/local/projectDirName/";
    const cmakeSettingsJson = path.join(sourceDir, "CMakeSettings.json");

    const configurations: settingsRunner.Configuration[] = settingsRunner.parseConfigurations(json.configurations, cmakeSettingsJson, sourceDir);
    console.log(`Parsed configurations:  ${String(configurations)}`);
    for (const conf of configurations) {
      for (const name in conf.environments) {
        console.log(`'${name}'=${String(conf.environments[name])}`);
      }
    }

    const confUnderTest: settingsRunner.Configuration = configurations[1];
    const environmentsMap: settingsRunner.EnvironmentMap = settingsRunner.parseEnvironments(
      json.environments
    )
    const propertiesEval = new settingsRunner.PropertyEvaluator(confUnderTest, environmentsMap, new ifacelib.TaskLib());

    const evaluatedConfiguration: settingsRunner.Configuration = confUnderTest.evaluate(propertiesEval);
    evaluatedConfiguration.setEnvironment(environmentsMap);

    // Assert on evaluation.
    assert.equal(evaluatedConfiguration.buildDir, "/local/projectDirName/build/Windows Release", "build dir must be right");
    assert.equal(evaluatedConfiguration.cmakeArgs, "Release Releaseenv Releasenoname Releaseused Releaseused2 ${CONFIGURATIONunused}", "cmakeArgs must be right");
    assert.equal(evaluatedConfiguration.generator, "Ninja", "cmake generator must be right");

    // Asserts on environments.
    assert.equal(process.env["CONFIGURATIONenv"], "Releaseenv");
    assert.equal(process.env["CONFIGURATIONnoname"], "Releasenoname");
    assert.equal(process.env["envGlobalVarName"], "envGlobalVarValue");
    assert.equal(process.env["CONFIGURATIONused2"], "Releaseused2");
    // Environment without a name are automatically inherited by any configuration.
    assert.equal(process.env["noNameGlobalVarName"], "noNameGlobalVarValue");
    assert.equal(process.env["emptyNameGlobalVarName"], "emptyNameGlobalVarValue");
    assert.equal(process.env["customEnvVarName"], "customEnvVarValue", "customEnvVarName must be defined, as it is  inherited");

    assert.ok(process.env["CONFIGURATIONunused"], "Not inherited environment should not be inherited");
    done();
  });
});

