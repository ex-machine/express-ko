'use strict';

let promisify = require('pify');

let del = require('del');
let extend = require('extend');
let git = require('nodegit');
let mkdirp = promisify(require('mkdirp'));
let path = require('path');
let semver = require('semver');

let gulp = require('gulp');

let gulp$ = extend(require('gulp-load-plugins')({ pattern: ['gulp-*', 'gulp.*', '!gulp-git'] }), {
	git: promisify(require('gulp-git')),
	runSequence: promisify(require('run-sequence'))
});



let expressTmpPath = path.resolve('tmp/express');
let expressSpecsPath = path.resolve('test/express/test');



gulp.task('test', () => gulp$.runSequence(
	'test:express-install',
	'test:express-prepare',
	'test:express',
	'test:package'
));

gulp.task('test:package', () => gulp$.runSequence(
	'test:unit',
	'test:acceptance'
));

gulp.task('test:acceptance', () => {
	return gulp.src(['test/acceptance/**/*.spec.js'])
	.pipe(gulp$.debug({ title: 'test:unit' }))
	.pipe(gulp$.mocha({
		bail: false,
		ignoreLeaks: false,
		slow: 100,
		require: ['env-test', path.resolve('test/prereqs-acceptance')]
	}))
	.once('error', (err) => {
		throw err;
	});
});

gulp.task('test:unit', () => {
	return gulp.src(['test/unit/**/*.spec.js'])
	.pipe(gulp$.debug({ title: 'test:unit' }))
	.pipe(gulp$.mocha({
		bail: false,
		ignoreLeaks: false,
		slow: 20,
		require: [path.resolve('test/prereqs-unit')]
	}))
	.once('error', (err) => {
		throw err;
	})
});

gulp.task('test:express', () => {
	let blacklisted = [
		'req.query.js',
		'res.download.js',
		'res.sendFile.js'
	]
	.map((filename) => '!**/' + filename);

	return gulp.src([path.join(expressSpecsPath, '*.js'), ...blacklisted])
	.pipe(gulp$.debug({ title: 'test:express' }))
	.pipe(gulp$.mocha({
		bail: false,
		ignoreLeaks: false,
		require: [path.join(expressSpecsPath, 'support/env')]
	}))
	.once('error', (err) => {
		throw err;
	});
});

gulp.task('test:express-prepare:clean', () => del([expressSpecsPath]));

gulp.task('test:express-prepare', ['test:express-prepare:clean'], () => {
	return gulp.src([path.join(expressTmpPath, 'test/**/*')], { dot: true })
	.pipe(gulp$.debug({ title: 'test:express-prepare' }))
	.pipe(gulp.dest(expressSpecsPath));
});

gulp.task('test:express-install:clean', () => del(['./tmp']));

gulp.task('test:express-install', ['test:express-install:clean'], () => {
	let expressSemver = require(path.resolve('package.json')).devDependencies.express;

	return mkdirp(expressTmpPath)
	.then(() => git.Clone('https://github.com/expressjs/express.git', expressTmpPath))
	.then((repo) => {
		return git.Tag.list(repo)
		.then((tags) => {
			let expressVersion = semver.maxSatisfying(tags, expressSemver, true);

			if (!expressVersion) {
				throw new Error(`No Express version suits semver '${expressSemver}'`);
			}

			// working alternative to Tag.lookup and Repository.getTagByName
			return repo.getReferenceCommit(expressVersion);
		})
		.then((commit) => git.Checkout.tree(repo, commit, { checkoutStrategy: git.Checkout.STRATEGY.FORCE }));
	})
});

gulp.task('lint', () => gulp$.runSequence(
	'lint:lib',
	'lint:test'
));

gulp.task('lint:lib', () => {
	return gulp.src(['lib/**/*.js'])
	.pipe(gulp$.debug({ title: 'lint:lib' }))
	.pipe(gulp$.eslint())
	.pipe(gulp$.eslint.format())
	.pipe(gulp$.eslint.failAfterError());
});

gulp.task('lint:test', () => {
	return gulp.src(['test/unit/**/*.js'])
	.pipe(gulp$.debug({ title: 'lint:test' }))
	.pipe(gulp$.eslint())
	.pipe(gulp$.eslint.format())
	.pipe(gulp$.eslint.failAfterError());
});



gulp.task('help', gulp$.taskListing);

gulp.task('default', () => gulp$.runSequence(
	'lint',
	'test'
));
