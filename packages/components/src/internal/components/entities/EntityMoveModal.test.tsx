import React, { act } from 'react';

import { render } from '@testing-library/react';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryInfo } from '../../../public/QueryInfo';
import { getTestAPIWrapper } from '../../APIWrapper';

import { TEST_USER_EDITOR } from '../../userFixtures';

import { TEST_PROJECT_CONTAINER } from '../../containerFixtures';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { getEntityTestAPIWrapper } from './APIWrapper';
import { SampleTypeDataType } from './constants';
import { EntityMoveModal, EntityMoveModalProps, getMoveConfirmationProperties } from './EntityMoveModal';
import { OperationConfirmationData } from './models';

describe('EntityMoveModal', () => {
    const DEFAULT_SERVER_CONTEXT = { user: TEST_USER_EDITOR, container: TEST_PROJECT_CONTAINER };

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

    test('error', async () => {
        await act(async () => {
            renderWithAppContext(
                <EntityMoveModal
                    {...getDefaultProps()}
                    api={getTestAPIWrapper(jest.fn, {
                        entity: getEntityTestAPIWrapper(jest.fn, {
                            getMoveConfirmationData: () => Promise.reject('I am an error message.'),
                        }),
                    })}
                />,
                {
                    serverContext: DEFAULT_SERVER_CONTEXT,
                }
            );
        });
        expect(document.body.textContent).toContain('There was a problem retrieving the move confirmation data.');
    });

    test('cannot move, no valid selections', async () => {
        await act(async () => {
            renderWithAppContext(
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
                />,
                {
                    serverContext: DEFAULT_SERVER_CONTEXT,
                }
            );
        });

        expect(document.body.textContent).toContain(
            "The sample you've selected cannot be moved because it has a status that prevents moving or you lack the proper permissions."
        );
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
                'samples',
                true
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
                'samples',
                true
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
                'samples',
                true
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
                'samples',
                true
            );
            expect(props.canMove).toBeFalsy();
            expect(props.title).toBe('Cannot Move Sample');

            render(props.message);
            expect(document.querySelector('.alert')).toBeNull();
            expect(document.body.textContent).toContain(
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
                'samples',
                true
            );
            expect(props.canMove).toBeFalsy();
            expect(props.title).toBe('No Samples Can Be Moved');

            render(props.message);
            expect(document.querySelector('.alert')).toBeNull();
            expect(document.body.textContent).toContain(
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
                'samples',
                true
            );
            expect(props.canMove).toBeTruthy();
            expect(props.title).toBe('Move 1 Sample');

            render(props.message);
            expect(document.querySelector('.alert').textContent).toContain(
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
                'samples',
                true
            );
            expect(props.canMove).toBeTruthy();
            expect(props.title).toBe('Move 2 Samples');

            render(props.message);
            expect(document.querySelector('.alert').textContent).toContain(
                "You've selected 4 samples but only 2 can be moved. 2 samples cannot be moved because  they have status that prevents moving."
            );
        });

        test('multiple allowed, one not allowed and not permitted', () => {
            const props = getMoveConfirmationProperties(
                new OperationConfirmationData({
                    allowed: [{ rowId: 1 }, { rowId: 3 }],
                    notAllowed: [{ rowId: 2 }, { rowId: 4 }],
                    notPermitted: [{ rowId: 2 }],
                }),
                'sample',
                'samples',
                true
            );
            expect(props.canMove).toBe(true);
            expect(props.title).toBe('Move 2 Samples');

            render(props.message);
            expect(document.querySelector('.alert').textContent).toContain(
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
                'samples',
                true
            );
            expect(props.canMove).toBe(true);
            expect(props.title).toBe('Move 2 Samples');

            render(props.message);
            expect(document.querySelector('.alert').textContent).toContain(
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
                'samples',
                true
            );
            expect(props.canMove).toBe(true);
            expect(props.title).toBe('Move 2 Samples');

            render(props.message);
            expect(document.querySelector('.alert').textContent).toContain(
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
                'samples',
                true
            );
            expect(props.canMove).toBe(false);
            expect(props.title).toBe('No Samples Can Be Moved');
            render(props.message);
            expect(document.querySelector('.alert')).toBeNull();
            expect(document.body.textContent).toContain(
                "You don't have the required permission to move the selected samples."
            );
        });
    });
});
