import { filterDividedOptions } from './DividedOptionsRenderer';

describe('filterDividedOptions', () => {
   test('no options presented', () => {
       expect(filterDividedOptions(undefined, undefined)).toStrictEqual([]);
   });
   test('no dividers', () => {
       expect(filterDividedOptions([{label: 'option1', value: 'option1'}], [])).toStrictEqual([{label: 'option1', value: 'option1'}]);
       expect(filterDividedOptions([{label: 'option1', value: 'option1'}, {label: 'option2', value: 'option2'}], ['option2'])).toStrictEqual([{label: 'option1', value: 'option1'}]);
   });
   test('all selected', () => {
       expect(filterDividedOptions([{label: 'option1', value: 'o1'}, {label: 'option2', value: 'o2'}], ['o2', 'o1'])).toStrictEqual([]);

   });
   test('none selected', () => {
       expect(filterDividedOptions([{label: 'option1', value: 'o1'}, {label: undefined, isDivider: true}, {label: 'option2', value: 'o2'}], []))
           .toStrictEqual([
               {label: 'option1', value: 'o1'}, {label: undefined, isDivider: true}, {label: 'option2', value: 'o2'}
           ]);
   });
   test('remove last divider', () => {
       expect(filterDividedOptions([{label: 'option1', value: 'o1'}, {label: undefined, isDivider: true}, {label: 'option2', value: 'o2'}], ['o2']))
           .toStrictEqual([
               {label: 'option1', value: 'o1'}
           ]);
   });
   test('remove middle divider', () => {
       expect(filterDividedOptions([
               {label: 'option1', value: 'o1'},
               {label: undefined, isDivider: true},
               {label: 'option2', value: 'o2'},
               {label: undefined, isDivider: true},
               {label: 'option3', value: 'o3'},
           ],
           ['o2']))
           .toStrictEqual([
               {label: 'option1', value: 'o1'},
               {label: undefined, isDivider: true},
               {label: 'option3', value: 'o3'}
           ]);
   });
   test('remove first divider', () => {
       expect(filterDividedOptions([
               {label: 'option1', value: 'o1'},
               {label: undefined, isDivider: true},
               {label: 'option2', value: 'o2'},
               {label: undefined, isDivider: true},
               {label: 'option3', value: 'o3'},
           ],
           ['o1']))
           .toStrictEqual([
               {label: 'option2', value: 'o2'},
               {label: undefined, isDivider: true},
               {label: 'option3', value: 'o3'}
           ]);
   });
    test('remove multiple divider', () => {
        expect(filterDividedOptions([
                {label: 'option1', value: 'o1'},
                {label: 'd1', isDivider: true},
                {label: 'option2', value: 'o2'},
                {label: 'd2', isDivider: true},
                {label: 'option3', value: 'o3'},
            ],
            ['o1', 'o2']))
            .toStrictEqual([
                {label: 'option3', value: 'o3'}
            ]);
    });
});
