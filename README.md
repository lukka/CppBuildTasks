[![Build Status](https://dev.azure.com/CppBuild/CppBuildTasks/_apis/build/status/lukka.CppBuildTasks?branchName=master)](https://dev.azure.com/CppBuild/CppBuildTasks/_build/latest?definitionId=15&branchName=master)

# Azure DevOps [build tasks](https://marketplace.visualstudio.com/items?itemName=lucappa.cmake-ninja-vcpkg-tasks) for [CMake](https://www.cmake.org/) and [vcpkg](https://github.com/microsoft/vcpkg/)

 Build software with vcpkg and CMake (either with CMakeLists.txt or CMakeSettings.json), e.g.:

```yaml
  variables:
    # Exact vcpkg's version to fetch.
    vcpkgGitRef: 5a3b46e9e2d1aa753917246c2801e50aaabbbccc

    # Cache the vcpkg's build artifacts.
  - task: CacheBeta@0
    displayName: Cache vcpkg
    inputs:
      # As 'key' use the content of the response file, vcpkg's commit id and build agent name.
      # The key must be one liner, each segment separated by pipe, non-path segments enclosed by
      # double quotes.
      key: $(Build.SourcesDirectory)/vcpkg_x64-linux.txt | "$(vcpkgGitRef)" | "$(Agent.Name)"
      path: '$(Build.BinariesDirectory)/vcpkg'
   
   - task: lucappa.cmake-ninja-vcpkg-tasks.d855c326-b1c0-4d6f-b1c7-440ade6835fb.run-vcpkg@0
     displayName: 'Run vcpkg'
     inputs:
       # Response file stored in git repo, which provides list of packages and triplet.
       vcpkgArguments: @$(Build.SourcesDirectory)/vcpkg_x64-linux.txt
       vcpkgGitCommitId: $(vcpkgGitRef)
       vcpkgGitURL: http://your.vcpkg.fork.git/

   - task: lucappa.cmake-ninja-vcpkg-tasks.f2b1ec7d-bc54-4cc8-b9ed-1bc7f37c9dc6.run-cmake@0
     displayName: 'Run CMake with CMakeSettings.json'
     inputs:
       cmakeListsOrSettingsJson: 'CMakeSettingsJson'
       useVcpkgToolchainFile: true
       # Build all configurations whose name starts with "Linux".
       configurationRegexFilter: 'Linux.*'

```
[Reference](reference.md)


## Samples

|CMakeLists.txt samples | |
|----------|-------|
[macOS](https://dev.azure.com/CppBuild/CppBuildTasks/_git/CppBuildTasks-Validation?path=%2Fcmakelists.txt%2Fmacos-hosted-basic.yml&version=GBmaster)| [![Build Status](https://dev.azure.com/CppBuild/CppBuildTasks/_apis/build/status/cmakelists.txt-macos-hosted?branchName=master)](https://dev.azure.com/CppBuild/CppBuildTasks/_build/latest?definitionId=9&branchName=master)
[macOS with cache](https://dev.azure.com/CppBuild/CppBuildTasks/_git/CppBuildTasks-Validation?path=%2Fcmakelists.txt%2Fmacos-hosted-basic-cache.yml&version=GBmaster)|[![Build Status](https://dev.azure.com/CppBuild/CppBuildTasks/_apis/build/status/CMakeLists.txt%20samples/cmakelists.txt-macos-hosted-cache?branchName=master)](https://dev.azure.com/CppBuild/CppBuildTasks/_build/latest?definitionId=17&branchName=master)
[Windows - vs2019](https://dev.azure.com/CppBuild/CppBuildTasks/_git/CppBuildTasks-Validation?path=%2Fcmakelists.txt%2Fvs2019-hosted-basic.yml&version=GBmaster) | [![Build Status](https://dev.azure.com/CppBuild/CppBuildTasks/_apis/build/status/cmakelists.txt-vs2019-hosted?branchName=master)](https://dev.azure.com/CppBuild/CppBuildTasks/_build/latest?definitionId=1&branchName=master)
[Windows - vs2019 with cache](https://dev.azure.com/CppBuild/CppBuildTasks/_git/CppBuildTasks-Validation?path=%2Fcmakelists.txt%2Fvs2019-hosted-basic-cache.yml&version=GBmaster) | [![Build Status](https://dev.azure.com/CppBuild/CppBuildTasks/_apis/build/status/CMakeLists.txt%20samples/cmakelists.txt-vs2019-hosted-cache?branchName=master)](https://dev.azure.com/CppBuild/CppBuildTasks/_build/latest?definitionId=19&branchName=master)
[Windows - vs2017](https://dev.azure.com/CppBuild/CppBuildTasks/_git/CppBuildTasks-Validation?path=%2Fcmakelists.txt%2Fvs2017-hosted-basic.yml&version=GBmaster) | [![Build Status](https://dev.azure.com/CppBuild/CppBuildTasks/_apis/build/status/cmakelists.txt-vs2017-hosted?branchName=master)](https://dev.azure.com/CppBuild/CppBuildTasks/_build/latest?definitionId=14&branchName=master)
[Windows - vs2017 with cache](https://dev.azure.com/CppBuild/CppBuildTasks/_git/CppBuildTasks-Validation?path=%2Fcmakelists.txt%2Fvs2017-hosted-basic-cache.yml&version=GBmaster) | [![Build Status](https://dev.azure.com/CppBuild/CppBuildTasks/_apis/build/status/CMakeLists.txt%20samples/cmakelists.txt-vs2017-hosted-cache?branchName=master)](https://dev.azure.com/CppBuild/CppBuildTasks/_build/latest?definitionId=20&branchName=master)
[Linux/Ubuntu](https://dev.azure.com/CppBuild/CppBuildTasks/_git/CppBuildTasks-Validation?path=%2Fcmakelists.txt%2Fubuntu-hosted-basic.yml&version=GBmaster) | [![Build Status](https://dev.azure.com/CppBuild/CppBuildTasks/_apis/build/status/cmakelists.txt-ubuntu-hosted?branchName=master)](https://dev.azure.com/CppBuild/CppBuildTasks/_build/latest?definitionId=4&branchName=master)
[Linux/Ubuntu with cache](https://dev.azure.com/CppBuild/CppBuildTasks/_git/CppBuildTasks-Validation?path=%2Fcmakelists.txt%2Fubuntu-hosted-basic-cache.yml&version=GBmaster) | [![Build Status](https://dev.azure.com/CppBuild/CppBuildTasks/_apis/build/status/CMakeLists.txt%20samples/cmakelists.txt-ubuntu-hosted-cache?branchName=master)](https://dev.azure.com/CppBuild/CppBuildTasks/_build/latest?definitionId=18&branchName=master)

CMakeSettings.json samples |  |
|----------|-------|
[macOS](https://dev.azure.com/CppBuild/CppBuildTasks/_git/CppBuildTasks-Validation?path=%2Fcmakesettings.json%2Fmacos-hosted-advanced.yml&version=GBmaster) | [![Build Status](https://dev.azure.com/CppBuild/CppBuildTasks/_apis/build/status/cmakesettings.json-macos-hosted?branchName=master)](https://dev.azure.com/CppBuild/CppBuildTasks/_build/latest?definitionId=10&branchName=master)
[macOS with cache](https://dev.azure.com/CppBuild/CppBuildTasks/_git/CppBuildTasks-Validation?path=%2Fcmakesettings.json%2Fmacos-hosted-advanced-cache.yml&version=GBmaster) | [![Build Status](https://dev.azure.com/CppBuild/CppBuildTasks/_apis/build/status/CMakeSettings.json%20samples/cmakesettings.json-macos-hosted-cache?branchName=master)](https://dev.azure.com/CppBuild/CppBuildTasks/_build/latest?definitionId=24&branchName=master)
[Windows - vs2019](https://dev.azure.com/CppBuild/CppBuildTasks/_git/CppBuildTasks-Validation?path=%2Fcmakesettings.json%2Fvs2019-hosted-advanced.yml&version=GBmaster) | [![Build Status](https://dev.azure.com/CppBuild/CppBuildTasks/_apis/build/status/cmakesettings.json-vs2019-hosted?branchName=master)](https://dev.azure.com/CppBuild/CppBuildTasks/_build/latest?definitionId=2&branchName=master)
[Windows - vs2019 with cache](https://dev.azure.com/CppBuild/CppBuildTasks/_git/CppBuildTasks-Validation?path=%2Fcmakesettings.json%2Fvs2019-hosted-advanced-cache.yml&version=GBmaster) | [![Build Status](https://dev.azure.com/CppBuild/CppBuildTasks/_apis/build/status/CMakeSettings.json%20samples/cmakesettings.json-vs2019-hosted-cache?branchName=master)](https://dev.azure.com/CppBuild/CppBuildTasks/_build/latest?definitionId=25&branchName=master)
[Windows - vs2017](https://dev.azure.com/CppBuild/CppBuildTasks/_git/CppBuildTasks-Validation?path=%2Fcmakesettings.json%2Fvs2017-hosted-advanced.yml&version=GBmaster) | [![Build Status](https://dev.azure.com/CppBuild/CppBuildTasks/_apis/build/status/CMakeSettings.json%20samples/cmakesettings.json-vs2017-hosted?branchName=master)](https://dev.azure.com/CppBuild/CppBuildTasks/_build/latest?definitionId=13&branchName=master)
[Windows - vs2017 with cache](https://dev.azure.com/CppBuild/CppBuildTasks/_git/CppBuildTasks-Validation?path=%2Fcmakesettings.json%2Fvs2017-hosted-advanced-cache.yml&version=GBmaster) | [![Build Status](https://dev.azure.com/CppBuild/CppBuildTasks/_apis/build/status/CMakeSettings.json%20samples/cmakesettings.json-vs2017-hosted-cache?branchName=master)](https://dev.azure.com/CppBuild/CppBuildTasks/_build/latest?definitionId=22&branchName=master)
[Linux/Ubuntu](https://dev.azure.com/CppBuild/CppBuildTasks/_git/CppBuildTasks-Validation?path=%2Fcmakesettings.json%2Fubuntu-hosted-advanced.yml&version=GBmaster) | [![Build Status](https://dev.azure.com/CppBuild/CppBuildTasks/_apis/build/status/cmakesettings.json-ubuntu-hosted?branchName=master)](https://dev.azure.com/CppBuild/CppBuildTasks/_build/latest?definitionId=3&branchName=master)
[Linux/Ubuntu with cache](https://dev.azure.com/CppBuild/CppBuildTasks/_git/CppBuildTasks-Validation?path=%2Fcmakesettings.json%2Fubuntu-hosted-advanced-cache.yml&version=GBmaster) | [![Build Status](https://dev.azure.com/CppBuild/CppBuildTasks/_apis/build/status/CMakeSettings.json%20samples/cmakesettings.json-ubuntu-hosted-cache?branchName=master)](https://dev.azure.com/CppBuild/CppBuildTasks/_build/latest?definitionId=23&branchName=master)

project: [vct](https://github.com/sfreed141/vct) ||
|----------|-------|
[macOS/Linux/Windows](https://github.com/lukka/vct/blob/master/azure-pipeline-hosted.yml) | [![Build Status](https://dev.azure.com/CppBuild/CppBuildTasks/_apis/build/status/lukka.vct?branchName=master)](https://dev.azure.com/CppBuild/CppBuildTasks/_build/latest?definitionId=5&branchName=ci-build)


project: [cpprestsdk](https://github.com/microsoft/cpprestsdk) | |
|----------|-------|
[macOS](https://github.com/lukka/cpprestsdk/blob/master/pipeline-macos-hosted.yml) | [![Build Status](https://dev.azure.com/CppBuild/CppBuildTasks/_apis/build/status/macos-hosted-lukka.cpprestsdk?branchName=master)](https://dev.azure.com/CppBuild/CppBuildTasks/_build/latest?definitionId=11&branchName=master)
[Linux/Ubuntu](https://github.com/lukka/cpprestsdk/blob/master/pipeline-ubuntu-hosted.yml) | [![Build Status](https://dev.azure.com/CppBuild/CppBuildTasks/_apis/build/status/ubuntu-hosted-lukka.cpprestsdk?branchName=master)](https://dev.azure.com/CppBuild/CppBuildTasks/_build/latest?definitionId=6&branchName=master)
[vs2017](https://github.com/lukka/cpprestsdk/blob/master/pipeline-vs2017-hosted.yml) | [![Build Status](https://dev.azure.com/CppBuild/CppBuildTasks/_apis/build/status/vs2017-hosted-lukka.cpprestsdk?branchName=master)](https://dev.azure.com/CppBuild/CppBuildTasks/_build/latest?definitionId=7&branchName=master)
[vs2019](https://github.com/lukka/cpprestsdk/blob/master/pipeline-vs2019-hosted.yml) | [![Build Status](https://dev.azure.com/CppBuild/CppBuildTasks/_apis/build/status/vs2019-hosted-lukka.cpprestsdk?branchName=master)](https://dev.azure.com/CppBuild/CppBuildTasks/_build/latest?definitionId=12&branchName=master)

project: [CppOpenGLWebAssemblyCMake](https://github.com/lukka/CppOpenGLWebAssemblyCMake) | |
|----------|-------|
[webassembly/Linux/macOS/Windows](https://github.com/lukka/CppOpenGLWebAssemblyCMake/blob/master/azure-pipelines.yml) | [![Build Status](https://dev.azure.com/CppBuild/CppBuildTasks/_apis/build/status/wasm-and-native-win-linux-lukka.CppOpenGLWebAssemblyCMake?branchName=master)](https://dev.azure.com/CppBuild/CppBuildTasks/_build/latest?definitionId=8&branchName=master)

## Developers information

### Prerequisites

[gulp 4](https://www.npmjs.com/package/gulp4) and [tfx-cli 0.6+](https://www.npmjs.com/package/tfx-cli) globally installed.

### Packaging 

To package the extension for release purpose, run:
  
  > npm run pack

or to pack it for development purpose:

  > export MAJOR=3
  > export MINOR=0
  > npm run packdev

`MAJOR` and `MINOR` environment variables are used to set versions of extension and tasks. Note that the path is bumped automatically.
With 'packdev' GUIDs of extension and tasks are changed so the extension could be
uploaded and tested on Azure DevOps without interfering with already released tasks.
The name of the tasks have appended "-dev" to distringuish them.

### Testing

Run the whole test suite:

  > npm run test

or to have full output on stdout:

  > npm run testdev

#### Run a test with its javascript file 

 You can debug a single test with:
  
  > /usr/local/bin/node --inspect-brk task-cmake/build/tests/success-cmakesettings.js

and then debug in chrome's nodejsdevtools.

Or just use:

 > npm run test -- -g testname --inspect-brk

#### Run a test with its typescript file

 You can use 'mocha' to start a single test case you want to debug with Chrome's nodejs dev tools:

  > mocha --inspect-brk --require ts-node/register task-cmake/tests_suite.ts

 If breakpoints are not hit in the Chrome debugger, launch directly the .js file:

  > mocha --inspect-brk build/task-cmake/tests/success-cmakesettings-complex.js


#### Run a specific test

To run all tests that contains "toolchain" in the name:

  > npm run test -- -g toolchain

## License

[MIT](LICENSE.txt)
