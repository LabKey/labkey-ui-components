# Immer

[Immer](https://immerjs.github.io/immer/docs/introduction) is a JavaScript package that provides immutability for normal
JavaScript objects, arrays, Sets, and Maps. After internal review by several of our frontend engineers we've elected
to add Immer as a dependency and start using it for new development in lieu of [ImmutableJS](https://immutable-js.github.io/immutable-js/).
That said, we do not plan on actively migrating all usages away from ImmutableJS and it will remain a dependency for
the foreseeable future.

This document intends to outline why we're moving to Immer, provide some links to good resources for Immer, and provide
a couple of scenarios highlighting aspects of note.

## Rationale for switching

In April 2020 we took some time to start investigating how we could move
away from ImmutableJS. We've utilized ImmutableJS since 2015
to provide immutable data structures to work with on the client. At the time, it was one of the most well-supported
immutablility packages out there. Alas, as things progressed ImmutableJS started to fall out of favor for
several reasons.

#### Disadvantages of ImmutableJS

1. No longer actively developed. We use `v3.8.2` which was released in late 2016. `v4` has yet to get
passed "release candidate" status with it's most recent candidate releasing in late 2018.
1. API learning curve. Immutable provides all of its own data structures (e.g. `List`, `Map`, `Set`, etc) which are
wholy different from native JS data structures. While the API for these structures is powerful, allowing for really
complex mutations and iterations, it can be difficult to ramp up on understanding it all.
1. Poorly constructed `Record`. A class we rely on heavily is `Immutable.Record`. Extending record and
providing the correct typings annotations requires three declarations of each value. Additionally, due to the
nature of ImmutableJS, the constructor isn't able to make any effectual modifications of what the user passes in,
which lead to us using a `RecordType.create()` static method pattern. `Immutable.Record` was removed in `v4`.
1. Difficult to debug. The Immutable data structures can be difficult to debug and generally requires the code to be
modified to include `.toJS()` statements to understand what is actually held in a data structure.

#### Advantages of Immer

These are copied [directly from the website](https://immerjs.github.io/immer/docs/introduction#benefits):

1. Immutability with normal JavaScript objects, arrays, Sets and Maps. No new APIs to learn!
1. Strongly typed, no string based paths selectors etc.
1. Structural sharing out of the box
1. Object freezing out of the box
1. Deep updates are a breeze
1. Boilerplate reduction. Less noise, more concise code.
1. First class support for patches
1. Small: 3KB gzipped

## Learning Immer

This document intends to provide some specific insights about using Immer in our LabKey client-side code. As such, it expects
the reader to have an understanding of why Immer exists, what Immer does, and how Immer does it.

Before you read further it is **highly recommended** that you read (or watch) at least one the following:

- [Immer's official documentation](https://immerjs.github.io/immer/docs/introduction) - read the docs! Most up-to-date and covers lots of topics.
- [Introducing Immer: Immutability the easy way](https://hackernoon.com/introducing-immer-immutability-the-easy-way-9d73d8f71cb3) - written by the author of Immer
- [Simplify Creating Immutable Data Trees With Immer](https://egghead.io/lessons/redux-simplify-creating-immutable-data-trees-with-immer) - egghead.io video tutorial

## Scenarios

This section focuses on a couple of scenarios to help get a better understanding. These were written against `v6.0.3` of
Immer so things may have changed if you're working with a more current version.

### Immutable class

This scenario highlights declaring an immutable class in TypeScript using Immer. By the end we'll have an immutable class
that is both compile-time and run-time safe. To keep the class simple we're going to define a `Circle` class defined only
by its `radius`:

```ts
class Circle {
    radius: number;

    constructor(r: number) {
        this.radius = r;
    }
}
```

#### Run-time safety

This initial declaration is fully mutable. You can externally modify the radius after construction.

```ts
let circle = new Circle(5);
circle.radius = 10; // radius now 10
```

Let's try to use Immer on this class and see if it works:

```ts
import { produce } from 'immer';

let circle = produce(new Circle(5), () => {});
circle.radius = 10; // circle.radius is now 10! I thought using produce made it immutable!
```

To make a class immutable with Immer you first annotate the class with a [Symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol)
provided by Immer called `immerable`:

```ts
import { immerable } from 'immer';

class Circle {
    [immerable] = true;

    radius: number;

    constructor(r: number) {
        this.radius = r;
    }
}
```

What does this symbol do? To paraphrase the Immer docs:

> Classes must use the `immerable` symbol to mark itself as compatible with Immer.
When one of these objects is mutated within a producer, its prototype is preserved between copies.

Now this class is ready to be used with Immer. Let's try again using `produce`:

```ts
import { produce } from 'immer';

// without using produce the instance is still mutable
let circle = new Circle(5);
circle.radius = 20; // radius now 20.

// with produce the instance is now immutable
circle = produce(new Circle(5), () => {});
circle.radius = 10; // non-strict mode: fails silently. Radius still 5.
circle.radius = 10; // strict mode: Run-time error: Cannot assign to read only property 'radius' of object '#<Circle>'
```

Instances of this class declared via `produce` can only be mutated via `produce`. When an instance is passed through
Immer's `produce` function it will [freeze](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)
the object (when `immer.setAutoFreeze(true)`). Depending on the strict mode, any attempts to explicitly modify the object
will either fail to modify or throw a run-time error.

Now, let's actually make an update to the immutable instance with Immer:

```ts
import { produce } from 'immer';

// Create the initial instance
const circle = produce(new Circle(5), () => {});

// Mutate and copy from `produce`
const newCircle = produce(circle, (draft) => {
    draft.radius = 10;
});
console.log(circle.radius);    // 5
console.log(newCircle.radius); // 10
```

The instance is now immutable, a mutated copy can be made via `produce`, and we have run-time safety via `Object.freeze`.

#### Compile-time safety

Immer results in run-time safety from mutations to your objects, but used in conjunction with Typescript you can
also get compile-time safety. This has the advantages of catching errors earlier and applying to all code paths,
even those not covered by tests.

To get started, let's first declare all the properties on the `Circle` class as [`readonly`](https://www.typescriptlang.org/docs/handbook/classes.html#readonly-modifier).

```ts
import { immerable } from 'immer';

class Circle {
    [immerable] = true;

    readonly radius: number;

    constructor(r: number) {
        this.radius = r;
    }
}
```

The `radius` property is now read-only so if we attempt to modify it directly we receive an error:

```ts
import { produce } from 'immer';

let circle = new Circle(5);
circle.radius = 5; // Error: TS2540: Cannot assign to 'radius' because it is a read-only property.

// Same for the produced version
let circle = produce(new Circle(5), () => {});
circle.radius = 5; // Error: TS2540: Cannot assign to 'radius' because it is a read-only property.
```

This gives us compile-time safety against invalid writes. The next feature we can use is the `Draft` utility from
Immer. `Draft` To quote the docs:

> The `Draft` utility type can be used if the state argument type is immutable.

```ts
import { Draft, produce } from 'immer';

// Without "Draft"
let circle = produce(new Circle(5), (draft: Circle) => {
    draft.radius = 10; // Error: TS2540: Cannot assign to 'radius' because it is a read-only property.
});

// With "Draft"
let circle = produce(new Circle(5), (draft: Draft<Circle>) => {
    draft.radius = 10; // OK!
});
```

If you'd like to have your class instances be immutable without requiring use of `produce` you can directly call
`Object.freeze` at the end of the constructor.

```ts
import { immerable } from 'immer';

class Circle {
    [immerable] = true;

    readonly radius: number;

    constructor(r: number) {
        this.radius = r;

        // Optionally, freeze the instance. Still works with produce but doesn't require it to have
        // an immutable instance via construction.
        Object.freeze(this);
    }
}
```

Now we have an immutable class that is compile-time safe, run-time safe, and can be utilized by Immer.
