# Contributing

   * [Prerequisites](#prerequisites)
   * [Building](#build-and-lint)
   * [Packaging](#packaging)
   * [Testing](#testing)
     * [Run a test with its javascript file](#run-a-test-with-its-javascript-file)
     * [Run a test with its typescript file](#run-a-test-with-its-typescript-file)
     * [Run a specific test](#run-a-specific-test)


## Prerequisites
[gulp 4](https://www.npmjs.com/package/gulp4) and [tfx-cli 0.6+](https://www.npmjs.com/package/tfx-cli) globally installed.

## Build and lint
Build using `tsc` by:

 > npm run build

Launch `eslint` by:

 > npm run lint

## Packaging 
To build, lint validate and package the extension for release purpose, run:
  
  > npm run pack

or to pack it for development purpose:

  > export MAJOR=0 \
  > export MINOR=9 \
  > npm run packdev 

`MAJOR` and `MINOR` environment variables are used to set the version of extension and tasks. Note that the path is bumped automatically at each run.
Using 'packdev', GUIDs of extension and tasks are changed so the extension could be
uploaded and tested on Azure DevOps without interfering with the already released tasks.
The name of the tasks have appended "-dev" to distringuish them from the already released ones.

## Testing
Run the whole test suite:

  > npm run test

or to have full output on stdout:

  > npm run testdev

### Run a test with its javascript file 
 It is possible to debug a single test with:
  
  > /usr/local/bin/node --inspect-brk build-tasks/task-cmake/tests/success-cmakesettings.js

and then debug in chrome's nodejsdevtools.

Or just use:

 > npm run test -- -g testname --inspect-brk

### Run a test with its typescript file
 It is possible to use 'mocha' to start a single test case to debug with Chrome's nodejs development tools:

  > mocha --inspect-brk --require ts-node/register build-tasks/task-vcpkg/tests/_suite.ts

 If breakpoints are not hit in the Chrome debugger, launch directly the .js file:

  > mocha --inspect-brk build/task-cmake/tests/success-cmakesettings-complex.js


### Run a specific test
To run all tests that contains "toolchain" in the name:

  > npm run testdev -- -g toolchain
