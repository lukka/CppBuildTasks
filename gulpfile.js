const gulp = require('gulp');
const path = require('path');
const install = require('gulp-install');
const ts = require("gulp-typescript");
const jsonTransform = require('gulp-json-transform');

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

var buildTasks = function () {
  gulp.src(["./package.json", "./task-cmake/package.json", "./task-vcpkg/package.json"]).pipe(install());

  gulp.src("vss-extension.json")
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
    }, 2)).pipe(gulp.dest("."));

  gulp.src("task-vcpkg/task.json")
    .pipe(jsonTransform(function (json, file) {
      setupTaskJson(json, readPatch);
      return json;
    }, 2)).pipe(gulp.dest("task-vcpkg"));

  gulp.src("task-cmake/task.json")
    .pipe(jsonTransform(function (json, file) {
      return setupTaskJson(json, readPatch);
    }, 2)).pipe(gulp.dest("task-cmake"));

  var tsProject = ts.createProject('tsconfig.json');
  return tsProject.src()
    .pipe(tsProject())
    .js.pipe(gulp.dest(path.join('build')));
};

var buildActions = function () {
  return gulp.src(
    './task-vcpkg/src/base-lib.ts',
    './task-vcpkg/src/vcpkg-runner.ts')
    .pipe(gulp.dest('./action-vcpkg/src/'));
}

gulp.task('buildActions', buildActions);

gulp.task('default', gulp.series('buildActions', buildTasks));
