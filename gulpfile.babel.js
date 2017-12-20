'use strict';

import pug from "gulp-pug2"
import rev from 'gulp-rev';
import gulp from 'gulp';
import data from "gulp-data"
import deploy from 'gulp-gh-pages';
import connect from 'gulp-connect';
import merge from 'merge-stream';
import gulpif from 'gulp-if';
import gulpIgnore from 'gulp-ignore';
import glob from 'glob';
import path from 'path';
import fs from "fs";
import _ from "lodash"
import readFile from "fs-readfile-promise"


const events = [
  { loc: "rix/2015", history: [] },
  { loc: "rix/2016", history: [] },
  { loc: "rix/2017", history: ["2016", "2015"] },
  { loc: "rix/2018", history: ["2017", "2016", "2015"], current: true}
];

const dirs = {
  dest: 'build',
  statics: [,
      'CNAME'
    ]  
};

const eventJs = (loc) => {
    try {
      var content = fs.readFileSync(`events/${loc}/js/event.js`, "utf8")
      var json = JSON.parse(content)[0];
      return json;
    } catch (err) {
        console.log(err);
        return {};
    }
}

gulp.task('copy-statics', () => {
  return gulp
      .src(dirs.statics, {base: '.'})
      .pipe(gulp.dest(dirs.dest));

});

gulp.task('copy-events', () => {
  return merge(events.map(event => {
    console.log(`Copying event template for ${event.loc}`)
    return gulp
        .src('event-template/**/*', {base: 'event-template'})    
        .pipe(gulpif(/.pug/, pug({data: _.extend({}, eventJs(event.loc), event) })))
        .pipe(event.current ? gulp.dest(`build`) : gulp.dest(`build/${event.loc}`))
  }))
});

gulp.task('events', ['copy-events'], () => {
  return merge(events.map(event => {
    console.log(`Overriding ${event.loc} with specifics files`)
    var base = event.current ? `events/${event.loc}` : 'events'
    return gulp
      .src(`events/${event.loc}/**/*`, {base: base})
      .pipe(gulp.dest(dirs.dest))
  }))  
})

gulp.task('connect', () => {
  connect.server({
    root: 'build'
  });
});

gulp.task('watch', () => {
  gulp.watch(["event-template/**/*", "events/**/*"], ['build']);
});


gulp.task('build', ['events', 'copy-statics']);
gulp.task('deploy', ['ghPages']);


gulp.task('ghPages', () => {
  return gulp
      .src(['./build/**/*'])
      .pipe(deploy({
          	remoteUrl: "https://eduardsi:${GH_TOKEN}@github.com/devternity/devternity.github.io.git",
            branch: "master"
          }));
});

gulp.task('default', ['build', 'watch', 'connect']);
