This extension provides the tasks **'Run vcpkg'** and **'Run CMake'** to build C++ code on Azure DevOps pipelines. Take a look at examples in the [README.md](https://github.com/lukka/CppBuildTasks/blob/master/README.md) file. 

## The '**Run vcpkg**' task

It uses [Git](https://git-scm.com/) to fetch [vcpkg](https://github.com/microsoft/vcpkg), it builds it, then launches vcpkg to build the specified ports.
It sets `VCPKG_ROOT` environment variable that could be reused by subsequent tasks (i.e. by 'Run CMake').

### Caching vcpkg's artifacts on the build pipeline

The "Run vcpkg' task would benefit a lot from the [caching capabilities of the Azure Devops Pipelines](https://devblogs.microsoft.com/devops/adding-caching-to-azure-pipelines/), as described [here](https://github.com/microsoft/azure-pipelines-yaml/pull/113#issuecomment-470292844).
The caching feature is not public yet as of May 2019, documentation and samples on how to leverage it would be provided as the [feature](https://dev.azure.com/mseng/AzureDevOpsRoadmap/_workitems/edit/1458319) is public.

The storage Ninja, vcpkg and its installed ports is as follows:

 - vcpkg and Ninja are stored at resp `$(Build.BinariesDirectory)/vcpkg`
   and `$(Build.BinariesDirectory)/downloads/`; both are kept (i.e. cached) among multiple runs of the same build definition on the same private agent; 
 - vcpkg's artifacts are stored at `$(Build.BinariesDirectory)/vcpkg/installed`

## The '**Run CMake**' task

The 'Run CMake' task works with CMakeLists.txt and [CMakeSettings.json](https://docs.microsoft.com/en-us/cpp/build/cmakesettings-reference?view=vs-2019).
It can leverage the previous execution of the 'Run vcpkg' task by using the `VCPKG_ROOT` environment variable to:

  - set the vcpkg's toolchain file if requested, located at `$VCPKG_ROOT/scripts/buildsystems/vcpkg.cmake`;
  - set the environment for the provided triplet when building with [msvc](https://docs.microsoft.com/en-us/cpp/build/reference/c-cpp-building-reference?view=vs-2019) on Windows (i.e. building in the environment created by launching `$VCPKG_ROOT/vcpkg env`); 
 
## Questions and Answers

### Why not one single task?

Because you could use vcpkg only, without CMake. Or you could use CMake without vcpkg.

### Would creating an ad-hoc bash/powershell script be easier?

Absolutely! Anyone can use this task as an inspiration for writing their own scripts to suite specific needs.
The purpose of the tasks is to streamline and to simplyfy the usage of vcpkg and CMake on build servers.

## Please get the source and contribute

The software is provided as is, there is no warranty of any kind. All users are encouraged to get the [source code](https://github.com/lukka/CppBuildTasks) and improve the tasks with fixes and new features. 

## Tasks' Flowcharts

### The 'Run CMake" flowchart

The flowchart has two entry points as it could be used with a CMakeLists.txt or with a CMakeSettings.json file.


>  ![Run CMake task](task-cmake/docs/task-cmake.png)


### The 'Run vcpkg' flowchart


>  ![Run vcpkg task](task-vcpkg/docs/task-vcpkg.png)


