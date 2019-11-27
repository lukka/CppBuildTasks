const gulp = require('gulp');
const path = require('path');
const install = require('gulp-install');
const ts = require("gulp-typescript");
const sourcemaps = require("gulp-sourcemaps");
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

var installPackages = function () {
  return gulp.src([
    "./package.json",
    "./task-cmake/package.json",
    "./task-vcpkg/package.json",
    "./action-vcpkg/package.json"]).pipe(install());

}

var prepareVsix = function () {

  installPackages();

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

  var tsProject = ts.createProject('./tsconfig.json');
  tsProject.src()
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.join('build')));

  return copySharedJSFiles();
};

// Copy shared library files to consumers.
var copySharedJSFiles = function () {
  gulp.src(
    ['./build/lib-vcpkg/src/*.js'])
    .pipe(gulp.dest('./build/action-vcpkg/src/'));
  return gulp.src(
    ['./build/lib-vcpkg/src/*.js'])
    .pipe(gulp.dest('./build/task-vcpkg/src/'));
}

gulp.task('default', prepareVsix);
