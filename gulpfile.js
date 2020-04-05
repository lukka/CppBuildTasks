// Copyright (c) 2019-2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

const gulp = require('gulp');
const path = require('path');
const install = require('gulp-install');
const ts = require("gulp-typescript");
const sourcemaps = require("gulp-sourcemaps");
const jsonTransform = require('gulp-json-transform');
const eslint = require('gulp-eslint');
var merge = require('merge-stream');

const newVersion = {
  "Major": parseInt(process.env.MAJOR, 10),
  "Minor": parseInt(process.env.MINOR, 10),
  "Patch": parseInt(process.env.PATCH, 10)
};
var readPatch = 0;

var appendDev = function (name) {
  if (name.endsWith("-dev") === false) {
    name = name + "-dev";
    return name;
  }
  return name;
}

var setupTaskJson = function (json, patchValue) {
  if (process.env.CPPBUILDTASKDEV) {
    json["friendlyName"] = appendDev(json["friendlyName"]);
    json["id"] = "a" + json["id"].substring(1);
    newVersion.Patch = patchValue;
  }
  json["version"] = newVersion;
  return json;
}

var installPackages = function () {
  return gulp.src([
    "./package.json",
    "./task-cmake/package.json",
    "./task-vcpkg/package.json"]).pipe(install());
}

var manipulateExtensionMetadata = function () {
  const indentSpaces = 2;
  return gulp.src("vss-extension.json")
    .pipe(jsonTransform(function (json, file) {
      if (process.env.CPPBUILDTASKDEV) {
        json["id"] = appendDev(json["id"]);
        json["contributions"][0].id = "a" + json["contributions"][0].id.substring(1);
        json["contributions"][1].id = "a" + json["contributions"][1].id.substring(1);
        json["public"] = false;
        readPatch = json["version"].split(".")[2];
        readPatch++;
        json["version"] = process.env.MAJOR + "." + process.env.MINOR + "." + readPatch;
      }
      return json;
    }, indentSpaces)).pipe(gulp.dest(".")).on('finish', () => {
      var b = gulp.src("task-vcpkg/task.json")
        .pipe(jsonTransform(function (json, file) {
          setupTaskJson(json, readPatch);
          return json;
        }, indentSpaces)).pipe(gulp.dest("task-vcpkg"));

      var c = gulp.src("task-cmake/task.json")
        .pipe(jsonTransform(function (json, file) {
          return setupTaskJson(json, readPatch);
        }, indentSpaces)).pipe(gulp.dest("task-cmake"));

      return merge(b, c);
    });
}

var build = function () {
  tsProject = ts.createProject('./tsconfig.json');
  return tsProject.src()
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.join('build-tasks')));
}

// Copy shared files to consumers.
var copyLibsFiles = function () {
  var a = gulp.src(
    ['./build-tasks/libs/run-vcpkg-lib/src/*.js'])
    .pipe(gulp.dest('./build-tasks/task-vcpkg/src/'));

  var b = gulp.src(
    ['./build-tasks/libs/run-cmake-lib/src/*.js'])
    .pipe(gulp.dest('./build-tasks/task-cmake/src/'));

  return merge(a, b);
}

// Copy the baselib for tasks to consumers.
var copyTaskBaseLib = function () {
  var a = gulp.src(
    ['./build-tasks/libs/task-base-lib/src/*.js',
      './build-tasks/libs/base-lib/src/*.js',
      './build-tasks/libs/base-lib/src/*.js'])
    .pipe(gulp.dest('./build-tasks/task-vcpkg/src/'));

  var b = gulp.src(
    ['./build-tasks/libs/task-base-lib/src/*.js',
      './build-tasks/libs/base-lib/src/*.js',
      './build-tasks/libs/base-lib/src/*.js'])
    .pipe(gulp.dest('./build-tasks/task-cmake/src/'));

  return merge(a, b);
}

/* //??var copyForTests = function () {
  var a = gulp.src(
    ['./build-tasks/libs/task-base-lib/src/*.js',
      './build-tasks/libs/base-lib/src/*.js',
      './build-tasks/task-cmake/src/*.js'])
    .pipe(gulp.dest('./build-tasks/task-cmake/tests/'));

  var b = gulp.src(
    ['./build-tasks/libs/task-base-lib/src/*.js',
      './build-tasks/libs/base-lib/src/*.js',
      './build-tasks/task-vcpkg/src/*.js'])
    .pipe(gulp.dest('./build-tasks/task-vcpkg/tests/'));

  return merge(a, b);
}*/

var eslinter = function () {
  return gulp.src(['**/*.ts'])
    // eslint() attaches the lint output to the "eslint" property
    // of the file object so it can be used by other modules.
    .pipe(eslint())
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.format())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    .pipe(eslint.failAfterError());
}

var copyTaskJsonFiles = function () {
  var a = gulp.src("task-vcpkg/task.json")
    .pipe(gulp.dest("build-tasks/task-vcpkg"))

  var b = gulp.src("task-cmake/task.json")
    .pipe(gulp.dest("build-tasks/task-cmake"));

  return merge(a, b);
}

gulp.task('eslint', eslinter);

gulp.task('installAll', installPackages);

gulp.task('build', build);

gulp.task('copyTaskBaseLib', copyTaskBaseLib);

gulp.task('copyLibsFiles', copyLibsFiles);

gulp.task('copyTaskJsonFiles', copyTaskJsonFiles);

//?? gulp.task('copyForTests', copyForTests);

gulp.task('manipulateExtensionMetadata', manipulateExtensionMetadata);

gulp.task('buildAndCopyOutput', gulp.series('build', 'copyTaskBaseLib', 'copyLibsFiles', 'copyTaskJsonFiles' /*, //??'copyForTests'*/));

gulp.task('default', gulp.series('installAll', 'manipulateExtensionMetadata', 'eslint', 'buildAndCopyOutput'));

