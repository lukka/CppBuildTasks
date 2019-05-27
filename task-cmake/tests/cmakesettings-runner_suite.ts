import * as assert from 'assert';
import * as settingsRunner from '../src/cmakesettings-runner'

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

    let configurations: settingsRunner.Configuration[] = settingsRunner.parseConfigurations(json);
    console.log(`ParsedConfigurations:  ${String(configurations)}`);
    for (const conf of configurations) {
      for (const name in conf.environments) {
        console.log(`'${name}'=${String(conf.environments[name])}`);
      }
    }

    let environmentsMap: settingsRunner.EnvironmentMap = settingsRunner.parseEnvironments(
      <any>[]
    )
    let propertiesEval = new settingsRunner.PropertyEvaluator(configurations[0], environmentsMap);
    propertiesEval.evaluate();

    assert.equal(configurations[0].cmakeArgs, "Release Releaseenv Releasenoname Releaseused Releaseused2 ${CONFIGURATIONunused}");
    done();
  });
});

