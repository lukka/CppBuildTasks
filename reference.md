# Tasks Reference 

## run-vcpkg
```yaml
   # The complete name of the task is given by: <publisherid>.<extensionid>.<taskid>.<taskname>@<version>
   # Only the task name and version are required.
   - task: run-vcpkg@0
     displayName: 'Run vcpkg'
     inputs:
       # [required] arguments for the vcpkg install command, e.g. a response file containing the list of packages as well as the triplet to be used for all packages
       # It is possible to specify a different triplet for each port, if not specified the one specified by --triplet will be used, e.g. a response file like the following:
       #
       # sqlite3:x64-osx
       # libmodbus:x86-osx
       # libmodbus
       # --triplet
       # x64-osx
       #
       # would install the following ports: 
       # sqlite3:x64-osx, libmodbus:x86-osx, libmodbus:x64-osx .
       vcpkgArguments: '@response_file.txt'
       # [optional] if vcpkg is a *submodule* of the parent repository, specify here the path to it. Do not use the vcpkgGitCommitId or vcpkgGitURL as they will not be used when vcpkg is a submodule.
       vcpkgDirectory: $(Build.SourcesDirectory)/vcpkg
       # [optional] select the default vcpkg triplet. It can also be specified per port, such as "boost:x64-osx".
       vcpkgTriplet: 'x64-linux'
       # [optional] URL of the Git repository to fetch.
       vcpkgGitURL: http://github.com/microsoft/vcpkg.git
       # [optional] the commit id or tag of the vcpkg repository to fetch. Branch names are no recommended here,
       # especially when using the same value as part of the key in Cache task.
       vcpkgGitCommitId: '$(vcpkgGitCommitId)'
```

## run-cmake
```yaml
   - task: run-cmake@0
     displayName: 'Run CMake with CMakeSettings.json'
     inputs:
       # [required] select CMakeSettingsJson if the input is a CMakeSettings.json file, or select CMakeListsTxtBasic or  CMakeListsTxtAdvanced for a CMakeLists.txt file specified in the 'cmakeListsTxtPath' property.
       cmakeListsOrSettingsJson: 'CMakeSettingsJson'
       # [required] the CMakeSettings.json, default value assumes it is in the root of the repository.
       cmakeSettingsJsonPath: '$(Build.SourcesDirectory)/CMakeSettings.json'
       # [optional] specify the CMake binary directory, where build files are generated. By default it is `$(Build.ArtifactStagingDirectory)/<configuration name>` .
       buildDirectory: $(Build.ArtifactStagingDirectory)/tools/
       # [optional] using VCPKG_ROOT env var, this will set the vcpkg's toolchain file and triplet.
       useVcpkgToolchainFile: true
       # [optional] selects which configurations to build with a regular expression. 
       configurationRegexFilter: 'Linux.*'
      # [optional] reuse the vcpkg toolchain file, default is false. If set to true, the VCPKG_ROOT environment variable set by the previous 'run-vcpkg' task will be used automatically to set the toolchain, unless the path is explicitly set in this 'run-cmake' task in 'cmakeToolchainPath'.
      useVcpkgToolchainFile: true
      # [optional] vcpkg default triplet, '$(VCPKG_TRIPLET)' by default, which is set by the run-vcpkg
      # task.
      vcpkgTriplet: 'x64-linux'

   - task: run-cmake@0
     displayName: 'Run CMake with CMakeLists.txt'
     inputs:
       # [required] use the task in basic mode with CMakeLists.txt. There is also an advanced mode 'CMakeListsTxtAdvanced'.
       cmakeListsOrSettingsJson: 'CMakeListsTxtBasic'
       # [required] path to CMakeLists.txt, default value assumes it is in the root.
       cmakeListsTxtPath: '$(Build.SourcesDirectory)/CMakeLists.txt'
       # [required] the default value is provided.
       buildDirectory: '$(Build.ArtifactStagingDirectory)'
       # [optional] CMake toolchain file, empty by default.
       cmakeToolchainPath: '$(Build.SourcesDirectory)/src/vcpkg_cmake/toolchain.cmake'
       # [optional] reuse the vcpkg toolchain file, default is false. If set to true, the VCPKG_ROOT environment variable set by the previous 'run-vcpkg' task will be used automatically to set the toolchain, unless the path is explicitly set in this 'run-cmake' task in 'cmakeToolchainPath'.
       useVcpkgToolchainFile: true
       # [optional] vcpkg default triplet, '$(VCPKG_TRIPLET)' by default
       vcpkgTriplet: 'x64-linux'
       # [optional] specify CMake build type, Debug by default.
       cmakeBuildType: 'Release'
       # [optional] specify CMake generator, Ninja by default.
       cmakeGenerator: 'Ninja'
       # [optional] 'cmake --build' appended arguments.
       buildWithCMakeArgs: '-- -v'
```
