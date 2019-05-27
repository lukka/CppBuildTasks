## Quick Reference 

```yaml
   - task: lucappa.cmake-ninja-vcpkg-tasks.d855c326-b1c0-4d6f-b1c7-440ade6835fb.run-vcpkg@0
     displayName: 'Run vcpkg'
     inputs:
       # [optional] select the vcpkg triplet
       vcpkgTriplet: 'x64-linux'
       # [required] list of packages
       vcpkgArguments: 'sqlite3 <....other packages....>'
       # [optional] url of the Git repository to fetch
       vcpkgGitURL: http://github.com/microsoft/vcpkg.git
       # [optional] the branch or the tag. Commit id could work if the server supports fetching it
       vcpkgGitCommitId: 'master'

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
      cmakeToolchainPath: 'toolchain.cmake'
      # [optional] Reuse the vcpkg toolchain file, default is off
      useVcpkgToolchainFile: true
      # [optional] Specify CMake build type, Debug by default
      cmakeBuildType: 'Release'
      # [optional] Specify CMake generator, Ninja by default
      cmakeGenerator: 'Ninja'
      # [optional] 'cmake --build' appended arguments
      buildWithCMakeArgs: '-- -v'

```
