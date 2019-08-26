# Tasks Reference 

## run-vcpkg
```yaml
   - task: lucappa.cmake-ninja-vcpkg-tasks.d855c326-b1c0-4d6f-b1c7-440ade6835fb.run-vcpkg@0
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
       # [optional] select the vcpkg triplet. It can also be specified per port, such as "boost:x64-osx"
       vcpkgTriplet: 'x64-linux'
       # [optional] URL of the Git repository to fetch
       vcpkgGitURL: http://github.com/microsoft/vcpkg.git
       # [optional] the commit id or tag of the vcpkg repository to fetch. Branch names are no recommended here,
       # especially when using the same value as part of the key in Cache task.
       vcpkgGitCommitId: '$(vcpkgGitCommitId)'
````

## run-cmake
````yaml
   - task: lucappa.cmake-ninja-vcpkg-tasks.f2b1ec7d-bc54-4cc8-b9ed-1bc7f37c9dc6.run-cmake@0
     displayName: 'Run CMake with CMakeSettings.json'
     inputs:
       # [required] select CMakeSettingsJson if the input is a CMakeSettings.json file, or select CMakeListsTxtBasic or  CMakeListsTxtAdvanced for a CMakeLists.txt file specified in the 'cmakeListsTxtPath' property
       cmakeListsOrSettingsJson: 'CMakeSettingsJson'
       # [required] the CMakeSettings.json, default value assumes it is in the root
       cmakeSettingsJsonPath: '$(Build.SourcesDirectory)/CMakeSettings.json'
       # [optional] using VCPKG_ROOT env var, this will set the vcpkg's toolchain file and triplet
       useVcpkgToolchainFile: true
       # [optional] build all Linux configurations in the CMakeSettings.json
       configurationRegexFilter: 'Linux.*'

  - task: lucappa.cmake-ninja-vcpkg-tasks.f2b1ec7d-bc54-4cc8-b9ed-1bc7f37c9dc6.run-cmake@0
    displayName: 'Run CMake with CMakeLists.txt'
    inputs:
      # [required] use the task in basic mode with CMakeLists.txt. There is also an advanced mode 'CMakeListsTxtAdvanced'.
      cmakeListsOrSettingsJson: 'CMakeListsTxtBasic'
      # [required] path to CMakeLists.txt, default value assumes it is in the root
      cmakeListsTxtPath: '$(Build.SourcesDirectory)/CMakeLists.txt'
      # [required] the default value is provided
      buildDirectory: '$(Build.ArtifactStagingDirectory)'
      # [optional] CMake toolchain file, empty by default
      cmakeToolchainPath: '$(Build.SourcesDirectory)/src/vcpkg_cmake/toolchain.cmake'
      # [optional] Reuse the vcpkg toolchain file, default is false. If set to true, the VCPKG_TRIPLET environment variable set by the previous 'run-vcpkg' task will be used automatically to set the toolchain, unless the path is explicitly set in this 'run-cmake' task in 'cmakeToolchainPath'.
      useVcpkgToolchainFile: true
      # [optional] Specify CMake build type, Debug by default
      cmakeBuildType: 'Release'
      # [optional] Specify CMake generator, Ninja by default
      cmakeGenerator: 'Ninja'
      # [optional] 'cmake --build' appended arguments
      buildWithCMakeArgs: '-- -v'
```
