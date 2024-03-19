import React from 'react';
import { mount } from 'enzyme';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';
import { Modal } from '../../Modal';
import { QueryInfo } from '../../../public/QueryInfo';
import { getTestAPIWrapper } from '../../APIWrapper';

import { Progress } from '../base/Progress';

import { Alert } from '../base/Alert';

import { getEntityTestAPIWrapper } from './APIWrapper';
import { EntityMoveConfirmationModal } from './EntityMoveConfirmationModal';
import { SampleTypeDataType } from './constants';
import { EntityMoveModal, EntityMoveModalProps, getMoveConfirmationProperties } from './EntityMoveModal';
import { OperationConfirmationData } from './models';
import { TEST_USER_EDITOR } from '../../userFixtures';
import { TEST_PROJECT_CONTAINER } from '../../containerFixtures';

describe('EntityMoveModal', () => {
    const DEFAULT_APP_CONTEXT = { user: TEST_USER_EDITOR, container: TEST_PROJECT_CONTAINER };

    function getDefaultProps(): EntityMoveModalProps {
        return {
            entityDataType: SampleTypeDataType,
            maxSelected: 1,
            onAfterMove: jest.fn(),
            onCancel: jest.fn(),
            queryModel: makeTestQueryModel(new SchemaQuery('schema', 'query'), new QueryInfo({}), { 1: {} }, [1], 1),
            useSelected: true,
        };
    }

    test('loading', () => {
        const wrapper = mountWithAppServerContext(<EntityMoveModal {...getDefaultProps()} />);
        expect(wrapper.find(Modal)).toHaveLength(1);
        expect(wrapper.find(Modal).text()).toContain('Loading confirmation data...');
        wrapper.unmount();
    });

    test('error', async () => {
        const wrapper = mountWithAppServerContext(
            <EntityMoveModal
                {...getDefaultProps()}
                api={getTestAPIWrapper(jest.fn, {
                    entity: getEntityTestAPIWrapper(jest.fn, {
                        getMoveConfirmationData: () => Promise.reject('I am an error message.'),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find(Modal)).toHaveLength(1);
        expect(wrapper.find(Modal).text()).toContain(
            'There was a problem retrieving the move confirmation data.'
        );
        wrapper.unmount();
    });

    test('cannot move, no valid selections', async () => {
        const wrapper = mountWithAppServerContext(
            <EntityMoveModal
                {...getDefaultProps()}
                api={getTestAPIWrapper(jest.fn, {
                    entity: getEntityTestAPIWrapper(jest.fn, {
                        getMoveConfirmationData: () =>
                            Promise.resolve(
                                new OperationConfirmationData({
                                    allowed: [],
                                    notAllowed: [1],
                                    idMap: { 1: false },
                                })
                            ),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find(Modal)).toHaveLength(1);
        expect(wrapper.find(Modal).text()).toContain(
            "The sample you've selected cannot be moved because it has a status that prevents moving or you lack the proper permissions."
        );
        wrapper.unmount();
    });

    test('can move, valid selection', async () => {
        const wrapper = mountWithAppServerContext(
            <EntityMoveModal
                {...getDefaultProps()}
                api={getTestAPIWrapper(jest.fn, {
                    entity: getEntityTestAPIWrapper(jest.fn, {
                        getMoveConfirmationData: () =>
                            Promise.resolve(
                                new OperationConfirmationData({
                                    allowed: [1],
                                    notAllowed: [],
                                    idMap: { 1: true },
                                })
                            ),
                    }),
                })}
            />,
            undefined,
            DEFAULT_APP_CONTEXT
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find(Modal)).toHaveLength(1);
        expect(wrapper.find(EntityMoveConfirmationModal)).toHaveLength(1);
        expect(wrapper.find(Progress)).toHaveLength(1);
        wrapper.unmount();
    });

    describe('getMoveConfirmationProperties', () => {
        test('no confirmationData', () => {
            expect(getMoveConfirmationProperties(undefined, 'sample', 'samples')).toBeUndefined();
        });

        test('no selection', () => {
            const props = getMoveConfirmationProperties(
                {
                    allowed: [],
                    notAllowed: [],
                    notPermitted: [],
                    idMap: {},
                    totalActionable: 0,
                    totalNotActionable: 0,
                } as OperationConfirmationData,
                'sample',
                'samples'
            );
            expect(props.canMove).toBeFalsy();
            expect(props.title).toBe('No Samples Can Be Moved');
            expect(props.message).toBeUndefined();
        });

        test('single allowed', () => {
            const props = getMoveConfirmationProperties(
                new OperationConfirmationData({
                    allowed: [{ rowId: 1 }],
                    notAllowed: [],
                    notPermitted: [],
                }),
                'sample',
                'samples'
            );
            expect(props.canMove).toBeTruthy();
            expect(props.title).toBe('Move 1 Sample');
            expect(props.message).toBeUndefined();
        });

        test('multiple allowed', () => {
            const props = getMoveConfirmationProperties(
                new OperationConfirmationData({
                    allowed: [{ rowId: 1 }, { rowId: 2 }],
                    notAllowed: [],
                    notPermitted: [],
                }),
                'sample',
                'samples'
            );
            expect(props.canMove).toBeTruthy();
            expect(props.title).toBe('Move 2 Samples');
            expect(props.message).toBeUndefined();
        });

        test('single not allowed', () => {
            const props = getMoveConfirmationProperties(
                new OperationConfirmationData({
                    allowed: [],
                    notAllowed: [{ rowId: 1 }],
                    notPermitted: [],
                }),
                'sample',
                'samples'
            );
            expect(props.canMove).toBeFalsy();
            expect(props.title).toBe('Cannot Move Sample');

            const wrapper = mount(props.message);
            expect(wrapper.find(Alert)).toHaveLength(0);
            expect(wrapper.first().text()).toBe(
                "The sample you've selected cannot be moved because it has a status that prevents moving or you lack the proper permissions. "
            );
        });

        test('multiple not allowed', () => {
            const props = getMoveConfirmationProperties(
                new OperationConfirmationData({
                    allowed: [],
                    notAllowed: [{ rowId: 1 }, { rowId: 2 }],
                    notPermitted: [],
                }),
                'sample',
                'samples'
            );
            expect(props.canMove).toBeFalsy();
            expect(props.title).toBe('No Samples Can Be Moved');

            const wrapper = mount(props.message);
            expect(wrapper.find(Alert)).toHaveLength(0);
            expect(wrapper.first().text()).toBe(
                "Neither of the 2 samples you've selected can be moved because they have a status that prevents moving or you lack the proper permissions."
            );
        });

        test('single allowed, single not allowed', () => {
            const props = getMoveConfirmationProperties(
                new OperationConfirmationData({
                    allowed: [{ rowId: 1 }],
                    notAllowed: [{ rowId: 2 }],
                    notPermitted: [],
                }),
                'sample',
                'samples'
            );
            expect(props.canMove).toBeTruthy();
            expect(props.title).toBe('Move 1 Sample');

            const wrapper = mount(props.message);
            expect(wrapper.find(Alert).text()).toContain(
                "You've selected 2 samples but only 1 can be moved. 1 sample cannot be moved because  it has status that prevents moving."
            );
        });

        test('multiple allowed, multiple not allowed', () => {
            const props = getMoveConfirmationProperties(
                new OperationConfirmationData({
                    allowed: [{ rowId: 1 }, { rowId: 3 }],
                    notAllowed: [{ rowId: 2 }, { rowId: 4 }],
                    notPermitted: [],
                }),
                'sample',
                'samples'
            );
            expect(props.canMove).toBeTruthy();
            expect(props.title).toBe('Move 2 Samples');

            const wrapper = mount(props.message);
            expect(wrapper.find(Alert).text()).toContain(
                "You've selected 4 samples but only 2 can be moved. 2 samples cannot be moved because  they have status that prevents moving."
            );
        });

        test('multiple allowed, one not allowed and not permitted', () => {
            const props = getMoveConfirmationProperties(
                new OperationConfirmationData({
                    allowed: [{ rowId: 1 }, { rowId: 3 }],
                    notAllowed: [{ rowId: 2 }, { rowId: 4 }],
                    notPermitted: [ { rowId: 2 } ],
                }),
                'sample',
                'samples'
            );
            expect(props.canMove).toBe(true);
            expect(props.title).toBe('Move 2 Samples');

            const wrapper = mount(props.message);
            expect(wrapper.find(Alert).text()).toContain(
                "You've selected 4 samples but only 2 can be moved. 2 samples cannot be moved because  they have status that prevents moving. Selection includes 1 sample that you do not have permission to move."
            );
        });

        test('all allowed, 1 not permitted', () => {
            const props = getMoveConfirmationProperties(
                new OperationConfirmationData({
                    allowed: [{ rowId: 1 }, { rowId: 2 }, { rowId: 3 }],
                    notAllowed: [],
                    notPermitted: [{ rowId: 2 }],
                }),
                'sample',
                'samples'
            );
            expect(props.canMove).toBe(true);
            expect(props.title).toBe('Move 2 Samples');

            const wrapper = mount(props.message);
            expect(wrapper.find(Alert).text()).toContain(
                "You've selected 3 samples but only 2 can be moved. Selection includes 1 sample that you do not have permission to move."
            );
        });

        test('allowed, not allowed, multiple not permitted with overlap', () => {
            const props = getMoveConfirmationProperties(
                new OperationConfirmationData({
                    allowed: [{ rowId: 1 }, { rowId: 4 }, { rowId: 3 }],
                    notAllowed: [{ rowId: 2 }, { rowId: 5 }],
                    notPermitted: [{ rowId: 2 }, { rowId: 3 }],
                }),
                'sample',
                'samples'
            );
            expect(props.canMove).toBe(true);
            expect(props.title).toBe('Move 2 Samples');

            const wrapper = mount(props.message);
            expect(wrapper.find(Alert).text()).toContain(
                "You've selected 5 samples but only 2 can be moved. 2 samples cannot be moved because  they have status that prevents moving. Selection includes 2 samples that you do not have permission to move."
            );
        });

        test('some allowed, none permitted', () => {
            const props = getMoveConfirmationProperties(
                new OperationConfirmationData({
                    allowed: [{ rowId: 1 }, { rowId: 3 }],
                    notAllowed: [{ rowId: 2 }],
                    notPermitted: [{ rowId: 1 }, { rowId: 2 }, { rowId: 3 }],
                }),
                'sample',
                'samples'
            );
            expect(props.canMove).toBe(false);
            expect(props.title).toBe('No Samples Can Be Moved');
            const wrapper = mount(props.message);
            expect(wrapper.find(Alert)).toHaveLength(0);
            expect(wrapper.first().text()).toContain(
                "You don't have the required permission to move the selected samples."
            );
        });
    });
});
