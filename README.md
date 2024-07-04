# rx-gdpr-guard

A bridge between rxjs and gdpr-guard

## How to import

Using typescript:

```typescript
import {
	RxGdprManager,
	rxWrapper,
} from "rx-gdpr-guard";

import type {
	RxGdprGuardGroup,
	RxGdprGuard,
	RxWrapper,
} from "rx-gdpr-guard";
```

Using ES6-style imports:

```javascript
import {
	RxGdprManager,
	rxWrapper,
} from "rx-gdpr-guard"
```

Using node-style require:

```javascript
const {
	RxGdprManager,
	rxWrapper,
} = require("rx-gdpr-guard");
```

Directly from your browser:

```javascript
const {
	RxGdprManager,
	rxWrapper,
} = rxGdprGuard;
```

## How to use

### Get a decorated manager instance

Via the wrapper/decorator function:

```javascript
const manager = rxWrapper(myGdprManager);
```

Via the `RxGdprManager` class:

```javascript
const manager = RxGdprManager.decorate(myGdprManager);
// OR
const manager = RxGdprManager.wrap(myGdprManager);
```

### Use the decorated manager like a regular manager

```javascript
const manager = RxGdprManager.wrap(myGdprManager);

manager instanceof GdprManager; // true

manager.disable();
manager.enable();
manager.getGuard("my-guard"); // RxGdprGuard|RxGdprGuardGroup|null
```

### Subscribe to observables

```javascript
const manager = RxGdprManager.wrap(myGdprManager);

manager.bannerWasShown$.subscribe(/* [...] */);
manager.enabled$.subscribe(/* [...] */);
manager.raw$.subscribe(/* [...] */);
manager.required$.subscribe(/* [...] */);
```

### Access data via lenses

These examples use `RxGdprManager` but it also works for `RxGdprGuard` and `RxGdprGuardGroup`.

```javascript
const manager = RxGdprManager.wrap(myGdprManager);
```

```javascript
manager.lensRaw(managerRaw => managerRaw.groups)
	.subscribe(groups => {
		/* [...] */
	});
//OR
manager.mapRaw(managerRaw => managerRaw.groups)
	.subscribe(groups => {
		/* [...] */
	});
```

```javascript
manager.lensRawThrough(managerRaw => rxFetchData(managerRaw))
	.subscribe(response => {
		/* [...] */
	});
// OR
manager.flatMapRaw(managerRaw => rxFetchData(managerRaw))
	.subscribe(response => {
		/* [...] */
	});
```

```javascript
manager.lens(rxManager => rxManager.getGroups())
	.subscribe(groups => {
		/* [...] */
	});
//OR
manager.mapRaw(rxManager => rxManager.getGroups())
	.subscribe(groups => {
		/* [...] */
	});
```

```javascript
manager.lensThrough(rxManager => rxManager.getGroup("my-group").enabled$)
	.subscribe(isEnabled => {
		/* [...] */
	});
// OR
manager.flatMap(rxManager => rxManager.getGroup("my-group").enabled$)
	.subscribe(isEnabled => {
		/* [...] */
	});
```

### Access groups

```typescript
const manager: RxGdprManager = RxGdprManager.wrap(myGdprManager);

const group: RxGdprGuardGroup = manager.getGroup("my-group")!;

group.enabled$.subscribe(/* [...] */);
group.raw$.subscribe(/* [...] */);
group.required$.subscribe(/* [...] */);
```

### Access guards

```typescript
const manager: RxGdprManager = RxGdprManager.wrap(myGdprManager);

const group: RxGdprGuard = manager.getGuard("my-guard")!;

group.enabled$.subscribe(/* [...] */);
group.raw$.subscribe(/* [...] */);
group.required$.subscribe(/* [...] */);
```

### Access guards from a group

```typescript
const manager: RxGdprManager = RxGdprManager.wrap(myGdprManager);

const group: RxGdprGuardGroup = manager.getGroup("my-group")!;

const guard: RxGdprGuard = group.getGuard("my-guard")!;

guard.enabled$.subscribe(/* [...] */);
guard.raw$.subscribe(/* [...] */);
guard.required$.subscribe(/* [...] */);
```
