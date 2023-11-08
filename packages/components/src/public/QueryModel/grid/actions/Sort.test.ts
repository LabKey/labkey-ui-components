import { QuerySort } from '../../../QuerySort';

import { ActionValue } from './Action';
import { SortAction } from './Sort';

describe('SortAction::actionValueFromSort', () => {
    let action;

    beforeEach(() => {
        // needs to be in beforeEach so it gets instantiated after beforeAll
        action = new SortAction();
    });

    test('no label, encoded column', () => {
        const value: ActionValue = action.actionValueFromSort(
            new QuerySort({
                dir: '-',
                fieldKey: 'U m$SLB',
            })
        );
        expect(value).toMatchObject({
            value: 'U m$SLB DESC',
            displayValue: 'U m/LB',
        });
    });

    test('no label, unencoded column', () => {
        const value: ActionValue = action.actionValueFromSort(
            new QuerySort({
                fieldKey: 'Units',
            })
        );
        expect(value).toMatchObject({
            value: 'Units ASC',
            displayValue: 'Units',
        });
    });

    test('with label', () => {
        const value: ActionValue = action.actionValueFromSort(
            new QuerySort({
                fieldKey: 'Units',
            }),
            'Labeling'
        );
        expect(value).toMatchObject({
            value: 'Units ASC',
            displayValue: 'Labeling',
        });
    });
});
