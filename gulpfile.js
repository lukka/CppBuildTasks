const gulp = require('gulp');
const path = require('path');
const install = require('gulp-install');
const ts = require("gulp-typescript");

var buildProjects = function() {
  gulp.src(["./package.json", "./task-cmake/package.json", "./task-vcpkg/package.json"]).pipe(install());

  var tsProject = ts.createProject('tsconfig.json');
  return tsProject.src()
      .pipe(tsProject())
      .js.pipe(gulp.dest(path.join('build')));
};

gulp.task('default', buildProjects);
