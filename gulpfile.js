/**
 * This snippet does not
 */
// let gulp  = require('gulp')
// let gutil = require('gulp-util')
// let concat = require('gulp-concat')
// let babel = require('gulp-babel')
// let uglify = require('gulp-uglify')
// let replace = require('gulp-replace')
//
// gulp.task('default',['concat'])
//
// gulp.task('concat',()=>{
//   gulp.src('lib/**/*.js')
//   .pipe(babel({presets: ['es2015']}))
//   .pipe(replace(/'use strict';/g, ''))
//   // .pipe(replace(/.*require.*\.\/.*/g, ''))
//   .pipe(uglify())
//   //.pipe(concat('server.js'))
//   .pipe(gulp.dest('dist'))
// })

/**
 * This snippet merges files before gulp tasks are executed
 * I haven't seen any gulp plugin for concatenation with requires properly, so this is the best procedure for now
 */

 let gulp  = require('gulp')
 let babel = require('gulp-babel')
 let uglify = require('gulp-uglify')
 let replace = require('gulp-replace')
 let browserify= require ('browserify')
 let fs= require ('fs')
 gulp.task('default',['browserify','uglifyBrowserify'])

 gulp.task('uglify',()=>{
   gulp.src('SERVER.js')
   .pipe(babel({presets: ['es2015']}))
   .pipe(replace(/'use strict';/g, ''))
   // .pipe(replace(/.*require.*\.\/.*/g, ''))
   .pipe(uglify())
   //.pipe(concat('server.js'))
   .pipe(gulp.dest('dist'))
 })

 gulp.task('browserify', () => {
  browserify({entries: 'lib/server.js',debug: true,node:true})
  .bundle()
  .pipe(fs.createWriteStream('./lib/SERVER.js'));
});

gulp.task('uglifyBrowserify',()=>{
  gulp.src('./lib/SERVER.js')
  .pipe(babel({presets: ['es2015']}))
  .pipe(replace(/'use strict';/g, ''))
  // .pipe(replace(/.*require.*\.\/.*/g, ''))
  .pipe(uglify())
  //.pipe(concat('server.js'))
  .pipe(gulp.dest('dist'))
})
