import { FilterAction } from './Filter';
import { Filter } from '@labkey/api';
import { ActionValue, Value } from './Action';
import { QueryInfo } from '../../../../public/QueryInfo';
import { fromJS, List } from 'immutable';
import { QueryColumn } from '../../../../public/QueryColumn';
import { initUnitTests, makeQueryInfo, makeTestData } from '../../../testHelpers';
import mixturesQuery from '../../../../test/data/mixtures-getQuery.json';
import mixturesQueryInfo from '../../../../test/data/mixtures-getQueryDetails.json';
import { QueryGridModel } from '../../../QueryGridModel';
import { SortAction } from './Sort';
import { QuerySort } from '../../../../public/QuerySort';


let queryInfo: QueryInfo;
let getColumns: () => List<QueryColumn>;

beforeAll(() => {
    initUnitTests();
    const mockData = makeTestData(mixturesQuery);
    queryInfo = makeQueryInfo(mixturesQueryInfo);
    const model = new QueryGridModel({
        queryInfo,
        messages: fromJS(mockData.messages),
        data: fromJS(mockData.rows),
        dataIds: fromJS(mockData.orderedRows),
        totalRows: mockData.rowCount,
    });
    getColumns = (all?) => (all ? model.getAllColumns() : model.getDisplayColumns());
});

describe("SortAction::parseParam", () => {
    let action;

    beforeEach(() => {
        // needs to be in beforeEach so it gets instantiated after beforeAll
        action = new SortAction(undefined, getColumns);
    });

    test("unencoded value, DESC", () => {
        const values = action.parseParam("ignored", "-name", getColumns());
        expect(values).toHaveLength(1);
        expect(values[0]).toMatchObject({
            displayValue: 'Name',
            param: '-name',
            value: 'name desc'
        });
        // verify(values[0], 'Name', '-name', 'name desc');
    });

    test("unencoded value, ASC", () => {
        const values = action.parseParam("ignored", "Name", getColumns());
        expect(values).toHaveLength(1);
        expect(values[0]).toMatchObject({
            displayValue: 'Name',
            param: 'Name',
            value: 'Name asc'
        });
    });

    test("encoded value, DESC", () => {
        const values = action.parseParam("ignored", "-Measure u$SL", getColumns());
        expect(values).toHaveLength(1);
        expect(values[0]).toMatchObject({
            displayValue: 'Measure u/L',
            param: '-Measure u/L',
            value: 'Measure u/L desc'
        })
    });

    test("encoded value, ASC", () => {
        const values = action.parseParam("ignored", "Name u$SL", getColumns());
        expect(values).toHaveLength(1);
        expect(values[0]).toMatchObject( {
            displayValue: 'Name u/L',
            param: 'Name u/L',
            value: 'Name u/L asc'
        })
    });
});

describe("SortAction::actionValueFromSort", () => {
    let action;

    beforeEach(() => {
        // needs to be in beforeEach so it gets instantiated after beforeAll
        action = new SortAction(undefined, getColumns);
    });

    test("no label, encoded column", () => {
        const value: ActionValue = action.actionValueFromSort(
            {
                dir: '-',
                fieldKey: "U m$SLB"
            }
        );
        expect(value).toMatchObject({
            value: 'U m$SLB DESC',
            displayValue: 'U m/LB',
        });
    });

    test("no label, unencoded column", () => {
        const value: ActionValue = action.actionValueFromSort(
            {
                fieldKey: "Units"
            }
        );
        expect(value).toMatchObject({
            value: 'Units ASC',
            displayValue: 'Units',
        });
    });

    test("with label", () => {
        const value: ActionValue = action.actionValueFromSort({
            fieldKey: "Units"
        }, 'Labeling'
        );
        expect(value).toMatchObject({
            value: 'Units ASC',
            displayValue: 'Labeling',
        });
    });
});
