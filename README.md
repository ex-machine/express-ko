Brings generators and promises to Express 4.x middleware and route handlers.

# Description

`express-ko` unleashes the power of coroutines on Express middleware functions with a touch of Koa (actually, it is a portmanteau of `koa` and `co`).

The package allows to use either promise-returning functions or generator functions (they are wrapped with `co` and may `yield` promises as well) as middlewares or route callbacks.

`express-ko` is nonintrusive. It doesn't hurt the behaviour of existing middlewares and route handlers but augments their functionality.

## Differences with Koa

As opposed to Koa, `this` context (`ctx` parameter in Koa 2) is not provided for `ko`-ified function — particularly because Express 4.x heavily relies on function signatures, like error handlers.

### Koa control flow

Koa may introduce powerful (and also confusing) patterns to the flow of control, like middleware stack bouncing:

```javascript
app.use(function* (next) {
	this.state.fooBar = 'foo';
	// `next` is a generator function and can be delegated
	yield* next;
	this.body = this.state.foobar;
});

app.use(function* () {
	this.state.foobar += yield Promise.resolve('bar');
});
```

### Express control flow

`express-ko` brings some syntax sugar to unsweetened callback hell, but middleware stack still works in one direction:

```javascript
app.use(ko(function* (req, res, next) {
	res.locals.foobar = 'foo';
	// `next` is a function and shouldn't be delegated
	return next;
}));

app.use(ko(function* () {
	res.locals.foobar += yield Promise.resolve('bar');
	return res.locals.foobar;
}));
```

# Usage

## `ko` wrapper

The wrapper created with `ko()` converts generator functions to promises via `co`. It processes resolution/rejection of a promise chain from both regular and generator functions, doing nothing on the functions that don't return promises.

### Patched router (recommended)

Express router may be patched with `ko.ify(express)` to replace all handlers supplied to router `use`, `param` and HTTP methods with wrapper functions that look for promises and generators.

- `express` can be replaced with `loopback` for StrongLoop LoopBack
- `ko.ify(express.Router, express.Route)` can be used to supply the constructors manually
- `ko.ify(null, express.Route)` will skip `.use` and `.param` patches

No manual wrapping with `ko()` is necessary. 

```javascript
let express = require('express');
let ko = require('express-ko');

ko.ify(express);

let app = express();
let router = Router();

app.use(router);
app.use(function (req, res, next) { ... })
app.param(function* (req, res, next, val) { ... });
router.use(function (err, req, res, next) { ... });
```

### Unpatched router (playing safe)

Each callback may be wrapped with `ko()` or left intact.

*`ko()` needs extra `true` argument for `param` callbacks to distinguish them from error handlers.*  

```javascript
let express = require('express');
let ko = require('express-ko');

let app = express();
let router = express.Router();

app.use(router);
app.use(function (req, res, next) { ... });
app.param(ko(function* (req, res, next, id) { ... }, true));
router.use(ko(function (err, req, res, next) { ... }));
```

# async/await 

Current implementations (TypeScript, Babel, Regenerator) fall back to generator or regular promise-returning functions, so transpiled `async` functions can be seamlessly used with `ko`.


### Original way

```javascript
app.all('/foo', (req, res, next) => {
	....then(() => {
		res.send('foo');
		next();
	});
}); 
```

### Suggested way (async/await)

```javascript
app.all('/foo', async (req, res) => {
	await ...;
	return res.send('foo');
}); 
```

### Alternative way (generators)

```javascript
app.all('/foo', function* (req, res) {
	yield ...;
	return res.send('foo');
}); 
```

### Alternative way (promises)

```javascript
app.all('/foo', (req, res) => ....then(() => res.send('foo'))); 
```

## Implicit `next()`

A resolution with `req` or `res` chain value executes `next()` and proceeds to next handler/middleware.

It is the most suitable way of treating `res.send(...); next();` case.

*Node.js HTTP methods (`.write()`, `.end()`) don't belong to Express API and aren't suitable for chaining; they return `boolean` and will cause undesirable implicit response.*

### Original way

```javascript
app.all('/foo', (req, res, next) => {
	....then((foo) => {
		res.send(foo);
		next();
	});
}); 
```
### Suggested way (generators)

```javascript
app.all('/foo', function* (req, res) {
	let foo = yield ...; 
	return res.send(foo);
}); 
```

### Alternative way (promises)

```javascript
app.all('/foo', (req, res) => ....then((foo) => res.send(foo))); 
```

## Explicit `next()`

A resolution with `ko.NEXT` constant or `next` (uncalled) function values executes `next()` and proceeds to next handler/middleware.

It is the most suitable way of treating the handlers where no `req` or `res` are involved.

*`next()` returns `undefined`, and resolving with it has no adverse effects. This behaviour of Express isn't documented and can be changed without notice.*

### Original way

```javascript
app.all('/foo', (req, res, next) => {
	next();
}); 
```

### Suggested way (generators)

```javascript
app.all('/foo', function* () {
	return ko.NEXT;
}); 
```

### Alternative ways (promises)

```javascript
app.all('/foo', () => Promise.resolve(ko.NEXT)); 
```

```javascript
app.all('/foo', (req, res, next) => Promise.resolve(next)); 
```

## Explicit `next('route')`

A resolution with `ko.NEXT_ROUTE` constant value executes `next('route')` and proceeds to next route/middleware.

No magic word 'route' (it has got odorous code smell) has to be involved in this case. 


### Original way

```javascript
app.all('/foo', (req, res, next) => {
	next('route');
}, ...); 
```

### Suggested way (generators)

```javascript
app.all('/foo', function* () {
	return ko.NEXT_ROUTE;
}, ...); 
```

### Alternative way (promises)

```javascript
app.all('/foo', () => Promise.resolve(ko.NEXT_ROUTE), ...); 
```

## Implicit `next(<error>)`

A resolution with `Error` object value causes promise chain rejection and executes `next(<error>)`.

*This behaviour is implemented to prevent the leakage of `Error` objects to response and shouldn't be intentionally used.*

### Original way

```javascript
app.all('/foo', (req, res, next) => {
	next(new Error);
}); 
```

### Suggested way

See *Explicit `next(<error>)`*.

### Alternative way (generators)

```javascript
app.all('/foo', function* () {
	return new Error;
}); 
```

### Alternative way (promises)

```javascript
app.all('/foo', () => Promise.resolve(new Error)); 
```

## Explicit `next(<error>)`

A rejection with `<error>` value executes `next(<error>)`.

*It is preferable to throw an object and not a string, to avoid accidental usage of magic word 'route'.*

### Original way

```javascript
app.all('/foo', (req, res, next) => {
	next(error');
}); 
```

### Suggested way (generators)

```javascript
app.all('/foo', function* () {
	throw new Error('error')
}); 
```

### Alternative ways (promises)

```javascript
app.all('/foo', () => ....then(() => {
	throw new Error('error');
})); 
```

```javascript
app.all('/foo', function* () {
	return Resolve.reject('error');
}); 
```

## Implicit `res.send(<response>)`

A resolution with any value except `undefined` and `number` executes `res.send(<response>)`.

It is the most suitable way of treating `res.send(...)` or `res.json(...)` with no `next()` case.

*`res.send(<number>)` is deprecated in favour of `res.sendStatus(<number>)`. See Express 4.x source code and API documentation on how `res.send` makes decisions on content type.*

### Original way

```javascript
app.all('/foo', (req, res) => {
	....then((foo) => {
		res.send(foo);
	});
}); 
```
### Suggested way (generators)

```javascript
app.all('/foo', function* (req, res) {
	let foo = yield ...; 
	return foo;
}); 
```

### Alternative way (promises)

```javascript
app.all('/foo', (req, res) => ....then((foo) => foo)); 
```

## Implicit `res.sendStatus(<number>)`

A resolution with `number` value executes `res.sendStatus(<number>)`.

It is the most suitable way of treating `res.sendStatus(...)` with no `next()` case.

### Original way

```javascript
app.all('/foo', (req, res) => {
	....then(() => {
		res.sendStatus(200);
	});
}); 
```
### Suggested way (generators)

```javascript
app.all('/foo', function* (req, res) {
	yield ...; 
	return 200;
}); 
```

### Alternative way (promises)

```javascript
app.all('/foo', (req, res) => ....then(() => 200)); 
```
