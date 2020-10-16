# naturalSort & naturalSortByProperty

By default JavaScript does not sort strings alphanumerically, which can lead to confusing experiences when rendering
data for users. We provide two utilities for sorting data, `naturalSort` and `naturalSortByProperty` to sort data
alphanumerically.

#### naturalSort
```js
const data = [
    'z1',
    'z10',
    'z2',
    'z10',
    'z4',
    'z1000',
    'z11',
    'z',
    'z3',
    'z6',
    'z7',
    'z9',
    'z11',
    'z14',
    'z18',
];

// Default JavaScript sorting:
console.log(data.sort());
// Logs:
[
   "z",
   "z1",
   "z10",
   "z10",
   "z1000",
   "z11",
   "z11",
   "z14",
   "z18",
   "z2",
   "z3",
   "z4",
   "z6",
   "z7",
   "z9",
]

// naturalSort:
console.log(data.sort(naturalSort));
// Logs:
[
  "z",
  "z1",
  "z2",
  "z3",
  "z4",
  "z6",
  "z7",
  "z9",
  "z10",
  "z10",
  "z11",
  "z11",
  "z14",
  "z18",
  "z1000"
]
```

#### naturalSortByProperty

`naturalSortByProperty` allows you to sort an array of objects alphanumerically. You can create a sorter for a specific
property of an object by calling `naturalSortByProperty(propertyName)`.

```js
const data = [
    { value: 'z' },
    { value: 'z2' },
    { value: 'z10' },
    { value: 'z100' },
    { value: 'z98' },
    { value: 'z14' },
    { value: 'z48' },
];
// Here we pass 'value' to naturalSortByProperty becuase we want to sort by the value property of each object.
console.log(data.sort(naturalSortByProperty('value')));
// Logs:
[
  { value: "z" },
  { value: "z2" },
  { value: "z10" },
  { value: "z14" },
  { value: "z48" },
  { value: "z98" },
  { value: "z100" },
]
```
