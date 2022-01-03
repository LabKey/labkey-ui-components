import { TestTypeDataType } from '../../../test/data/constants';

import { getFinderStartText } from './utils';

test('getFinderStartText', () => {
    expect(getFinderStartText([])).toBe('Start by adding  properties.');
    expect(getFinderStartText([TestTypeDataType])).toBe(
        'Start by adding ' + TestTypeDataType.nounAsParentSingular + ' properties.'
    );
    expect(getFinderStartText([TestTypeDataType, { ...TestTypeDataType, nounAsParentSingular: 'Other Parents' }])).toBe(
        'Start by adding ' + TestTypeDataType.nounAsParentSingular + ' or Other Parents properties.'
    );
    expect(
        getFinderStartText([
            TestTypeDataType,
            { ...TestTypeDataType, nounAsParentSingular: 'Other Parents' },
            { ...TestTypeDataType, nounAsParentSingular: 'Third Parents' },
        ])
    ).toBe('Start by adding ' + TestTypeDataType.nounAsParentSingular + ', Other Parents or Third Parents properties.');
});
