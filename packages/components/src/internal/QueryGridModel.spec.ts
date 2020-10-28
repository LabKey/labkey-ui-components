import { fromJS, List } from 'immutable';

import { QueryGridModel } from './QueryGridModel';

describe('QueryGridModel', () => {
    test('createParam no prefix', () => {
        const model = new QueryGridModel();
        expect(model.createParam('param')).toEqual('param');
        expect(model.createParam('param', 'default')).toEqual('default.param');
    });

    test('createParam with prefix', () => {
        const model = new QueryGridModel({
            urlPrefix: 'test',
        });
        expect(model.createParam('param')).toEqual('test.param');
        expect(model.createParam('param', 'default')).toEqual('test.param');
    });

    describe('getSelectedData', () => {
        test('nothing selected', () => {
            const model = new QueryGridModel({
                data: fromJS({
                    '1': {
                        field1: {
                            value: 'value1',
                        },
                        field2: {
                            value: 'value2',
                        },
                    },
                    '2': {
                        field1: {
                            value: 'value3',
                        },
                        field2: {
                            value: 'value4',
                        },
                    },
                }),
            });
            expect(model.getSelectedData().size).toBe(0);
        });

        test('all selected', () => {
            const model = new QueryGridModel({
                data: fromJS({
                    '123': {
                        field1: {
                            value: 'value1',
                        },
                        field2: {
                            value: 'value2',
                        },
                    },
                    '232': {
                        field1: {
                            value: 'value3',
                        },
                        field2: {
                            value: 'value4',
                        },
                    },
                }),
                selectedIds: List(['123', '232']),
            });
            expect(model.getSelectedData()).toEqual(model.data);
        });

        test('some selected', () => {
            const model = new QueryGridModel({
                data: fromJS({
                    '123': {
                        field1: {
                            value: 'value1',
                        },
                        field2: {
                            value: 'value2',
                        },
                    },
                    '234': {
                        field1: {
                            value: 'value3',
                        },
                        field2: {
                            value: 'value4',
                        },
                    },
                    '232': {
                        field1: {
                            value: 'value3',
                        },
                        field2: {
                            value: 'value4',
                        },
                    },
                }),
                selectedIds: List(['123', '232', 'nope']),
            });
            expect(model.getSelectedData()).toEqual(
                fromJS({
                    '123': {
                        field1: {
                            value: 'value1',
                        },
                        field2: {
                            value: 'value2',
                        },
                    },
                    '232': {
                        field1: {
                            value: 'value3',
                        },
                        field2: {
                            value: 'value4',
                        },
                    },
                })
            );
        });
    });
});
