import React, { FC } from 'react';

import { SchemaQuery } from '../../../public/SchemaQuery';
import { getTestAPIWrapper } from '../../APIWrapper';

import { TEST_USER_EDITOR } from '../../userFixtures';

import { TEST_PROJECT_CONTAINER } from '../../containerFixtures';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { getEntityTestAPIWrapper } from './APIWrapper';
import { SampleTypeDataType } from './constants';
import { EntityMoveModal, EntityMoveModalProps, getMoveConfirmationProperties } from './EntityMoveModal';
import { OperationConfirmationData } from './models';
import { waitFor } from '@testing-library/dom';
import { AppURL } from '../../url/AppURL';

describe('EntityMoveModal', () => {
    const DEFAULT_SERVER_CONTEXT = { user: TEST_USER_EDITOR, container: TEST_PROJECT_CONTAINER };

    function getDefaultProps(): EntityMoveModalProps {
        return {
            entityDataType: SampleTypeDataType,
            maxSelected: 1,
            onAfterMove: jest.fn(),
            onCancel: jest.fn(),
            rowIds: ['1'],
            schemaQuery: new SchemaQuery('schema', 'query'),
            targetAppURL: AppURL.create('fake', 'page'),
        };
    }

    test('error', async () => {
        renderWithAppContext(
            <EntityMoveModal
                {...getDefaultProps()}
                api={getTestAPIWrapper(jest.fn, {
                    entity: getEntityTestAPIWrapper(jest.fn, {
                        getMoveConfirmationData: () => Promise.reject('I am an error message.'),
                    }),
                })}
            />,
            { serverContext: DEFAULT_SERVER_CONTEXT }
        );
        await waitFor(() => {
            expect(document.querySelector('.modal-body')).toBeInTheDocument();
        });
        expect(document.querySelector('.modal-body')).toHaveTextContent(
            'There was a problem retrieving the move confirmation data.'
        );
    });

    test('cannot move, no valid selections', async () => {
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
            { serverContext: DEFAULT_SERVER_CONTEXT }
        );

        await waitFor(() => {
            expect(document.querySelector('.modal-body')).toBeInTheDocument();
        });

        expect(document.querySelector('.modal-body')).toHaveTextContent(
            'Cannot move the selected sample, it has a status or related data that prevents moving.'
        );
    });

    interface TestMoveConfirmationPropertiesProps {
        confirmationData: OperationConfirmationData;
        nounPlural: string;
        nounSingular: string;
        selectedCount: number;
    }

    // This component is necessary because getMoveConfirmationProperties renders a HelpLink, which uses useServerContext
    // so we need to be able to render something with renderWithAppContext
    const TestMoveConfirmationProperties: FC<TestMoveConfirmationPropertiesProps> = props => {
        const { confirmationData, nounPlural, nounSingular, selectedCount } = props;
        const moveProps = getMoveConfirmationProperties(confirmationData, nounSingular, nounPlural, selectedCount);

        if (moveProps === undefined) return <div id="empty-result" />;

        const { canMove, message, title } = moveProps;
        return (
            <div>
                <div id="canMove">{canMove.toString()}</div>
                <div id="title">{title}</div>
                <div id="message">{message}</div>
            </div>
        );
    };

    describe('getMoveConfirmationProperties', () => {
        const nounPlural = 'samples';
        const nounSingular = 'sample';
        test('no confirmationData', () => {
            renderWithAppContext(
                <TestMoveConfirmationProperties
                    confirmationData={undefined}
                    nounPlural={nounPlural}
                    nounSingular={nounSingular}
                    selectedCount={1}
                />
            );
            expect(document.querySelector('#empty-result')).toBeInTheDocument();
        });

        test('no selection', () => {
            const confirmationData = {
                allowed: [],
                notAllowed: [],
                notPermitted: [],
                idMap: {},
                totalActionable: 0,
                totalNotActionable: 0,
            } as OperationConfirmationData;
            renderWithAppContext(
                <TestMoveConfirmationProperties
                    confirmationData={confirmationData}
                    nounPlural={nounPlural}
                    nounSingular={nounSingular}
                    selectedCount={0}
                />
            );
            expect(document.querySelector('#canMove')).toHaveTextContent('false');
            expect(document.querySelector('#title')).toHaveTextContent('No Samples Can Be Moved');
            expect(document.querySelector('#message')).toBeEmptyDOMElement();
        });

        test('single allowed', () => {
            const confirmationData = new OperationConfirmationData({
                allowed: [{ rowId: 1 }],
                notAllowed: [],
                notPermitted: [],
            });
            renderWithAppContext(
                <TestMoveConfirmationProperties
                    confirmationData={confirmationData}
                    nounPlural={nounPlural}
                    nounSingular={nounSingular}
                    selectedCount={1}
                />
            );
            expect(document.querySelector('#canMove')).toHaveTextContent('true');
            expect(document.querySelector('#title')).toHaveTextContent('Move 1 Sample');
            expect(document.querySelector('#message')).toBeEmptyDOMElement();
        });

        test('multiple allowed', () => {
            const confirmationData = new OperationConfirmationData({
                allowed: [{ rowId: 1 }, { rowId: 2 }],
                notAllowed: [],
                notPermitted: [],
            });
            renderWithAppContext(
                <TestMoveConfirmationProperties
                    confirmationData={confirmationData}
                    nounPlural={nounPlural}
                    nounSingular={nounSingular}
                    selectedCount={2}
                />
            );
            expect(document.querySelector('#canMove')).toHaveTextContent('true');
            expect(document.querySelector('#title')).toHaveTextContent('Move 2 Samples');
            expect(document.querySelector('#message')).toBeEmptyDOMElement();
        });

        test('single not allowed', () => {
            const confirmationData = new OperationConfirmationData({
                allowed: [],
                notAllowed: [{ rowId: 1 }],
                notPermitted: [],
            });
            renderWithAppContext(
                <TestMoveConfirmationProperties
                    confirmationData={confirmationData}
                    nounPlural={nounPlural}
                    nounSingular={nounSingular}
                    selectedCount={1}
                />
            );
            expect(document.querySelector('#canMove')).toHaveTextContent('false');
            expect(document.querySelector('#title')).toHaveTextContent('Cannot Move Sample');

            expect(document.querySelector('#message')).toHaveTextContent(
                'Cannot move the selected sample, it has a status or related data that prevents moving.'
            );
            expect(document.querySelector('.alert')).not.toBeInTheDocument();
        });

        test('multiple not allowed', () => {
            const confirmationData = new OperationConfirmationData({
                allowed: [],
                notAllowed: [{ rowId: 1 }, { rowId: 2 }],
                notPermitted: [],
            });
            renderWithAppContext(
                <TestMoveConfirmationProperties
                    confirmationData={confirmationData}
                    nounPlural={nounPlural}
                    nounSingular={nounSingular}
                    selectedCount={2}
                />
            );
            expect(document.querySelector('#canMove')).toHaveTextContent('false');
            expect(document.querySelector('#title')).toHaveTextContent('No Samples Can Be Moved');

            expect(document.querySelector('.alert')).toBeNull();
            expect(document.querySelector('#message')).toHaveTextContent(
                'Cannot move the selected samples, they have a status or related data that prevents moving.'
            );
        });

        test('single allowed, single not allowed', () => {
            const confirmationData = new OperationConfirmationData({
                allowed: [{ rowId: 1 }],
                notAllowed: [{ rowId: 2 }],
                notPermitted: [],
            });
            renderWithAppContext(
                <TestMoveConfirmationProperties
                    confirmationData={confirmationData}
                    nounPlural={nounPlural}
                    nounSingular={nounSingular}
                    selectedCount={2}
                />
            );

            expect(document.querySelector('#canMove')).toHaveTextContent('true');
            expect(document.querySelector('#title')).toHaveTextContent('Move 1 Sample');
            expect(document.querySelector('.alert')).toHaveTextContent(
                "You've selected 2 samples but only 1 can be moved. 1 sample cannot be moved because it has a status or related data that prevents moving."
            );
        });

        test('multiple allowed, multiple not allowed', () => {
            const confirmationData = new OperationConfirmationData({
                allowed: [{ rowId: 1 }, { rowId: 3 }],
                notAllowed: [{ rowId: 2 }, { rowId: 4 }],
                notPermitted: [],
            });
            renderWithAppContext(
                <TestMoveConfirmationProperties
                    confirmationData={confirmationData}
                    nounPlural={nounPlural}
                    nounSingular={nounSingular}
                    selectedCount={4}
                />
            );

            expect(document.querySelector('#canMove')).toHaveTextContent('true');
            expect(document.querySelector('#title')).toHaveTextContent('Move 2 Samples');

            expect(document.querySelector('.alert')).toHaveTextContent(
                "You've selected 4 samples but only 2 can be moved. 2 samples cannot be moved because they have a status or related data that prevents moving."
            );
        });

        test('multiple allowed, one not allowed and not permitted', () => {
            const confirmationData = new OperationConfirmationData({
                allowed: [{ rowId: 1 }, { rowId: 3 }],
                notAllowed: [{ rowId: 2 }, { rowId: 4 }],
                notPermitted: [{ rowId: 2 }],
            });
            renderWithAppContext(
                <TestMoveConfirmationProperties
                    confirmationData={confirmationData}
                    nounPlural={nounPlural}
                    nounSingular={nounSingular}
                    selectedCount={4}
                />
            );

            expect(document.querySelector('#canMove')).toHaveTextContent('true');
            expect(document.querySelector('#title')).toHaveTextContent('Move 2 Samples');
            expect(document.querySelector('.alert')).toHaveTextContent(
                "You've selected 4 samples but only 2 can be moved. 2 samples cannot be moved because you lack the proper permissions, or they have a status or related data that prevents moving."
            );
        });

        test('all allowed, 1 not permitted', () => {
            const confirmationData = new OperationConfirmationData({
                allowed: [{ rowId: 1 }, { rowId: 2 }, { rowId: 3 }],
                notAllowed: [],
                notPermitted: [{ rowId: 2 }],
            });
            renderWithAppContext(
                <TestMoveConfirmationProperties
                    confirmationData={confirmationData}
                    nounPlural={nounPlural}
                    nounSingular={nounSingular}
                    selectedCount={3}
                />
            );

            expect(document.querySelector('#canMove')).toHaveTextContent('true');
            expect(document.querySelector('#title')).toHaveTextContent('Move 2 Samples');
            expect(document.querySelector('.alert')).toHaveTextContent(
                "You've selected 3 samples but only 2 can be moved. 1 sample cannot be moved because you lack the proper permissions."
            );
        });

        test('allowed, not allowed, multiple not permitted with overlap', () => {
            const confirmationData = new OperationConfirmationData({
                allowed: [{ rowId: 1 }, { rowId: 4 }, { rowId: 3 }],
                notAllowed: [{ rowId: 2 }, { rowId: 5 }],
                notPermitted: [{ rowId: 2 }, { rowId: 3 }],
            });

            renderWithAppContext(
                <TestMoveConfirmationProperties
                    confirmationData={confirmationData}
                    nounPlural={nounPlural}
                    nounSingular={nounSingular}
                    selectedCount={5}
                />
            );

            expect(document.querySelector('#canMove')).toHaveTextContent('true');
            expect(document.querySelector('#title')).toHaveTextContent('Move 2 Samples');

            expect(document.querySelector('.alert')).toHaveTextContent(
                "You've selected 5 samples but only 2 can be moved. 3 samples cannot be moved because you lack the proper permissions, or they have a status or related data that prevents moving."
            );
        });

        test('some allowed, none permitted', () => {
            const confirmationData = new OperationConfirmationData({
                allowed: [{ rowId: 1 }, { rowId: 3 }],
                notAllowed: [{ rowId: 2 }],
                notPermitted: [{ rowId: 1 }, { rowId: 2 }, { rowId: 3 }],
            });

            renderWithAppContext(
                <TestMoveConfirmationProperties
                    confirmationData={confirmationData}
                    nounPlural={nounPlural}
                    nounSingular={nounSingular}
                    selectedCount={3}
                />
            );

            expect(document.querySelector('#canMove')).toHaveTextContent('false');
            expect(document.querySelector('#title')).toHaveTextContent('No Samples Can Be Moved');
            expect(document.querySelector('.alert')).not.toBeInTheDocument();
            expect(document.querySelector('#message')).toHaveTextContent(
                'Cannot move the selected samples. You lack the proper permissions, or they have a status or related data that prevents moving.'
            );
        });

        test('some allowed, some deleted', () => {
            const confirmationData = new OperationConfirmationData({
                allowed: [{ rowId: 1 }, { rowId: 3 }],
                notAllowed: [],
                notPermitted: [],
            });

            renderWithAppContext(
                <TestMoveConfirmationProperties
                    confirmationData={confirmationData}
                    nounPlural={nounPlural}
                    nounSingular={nounSingular}
                    selectedCount={3}
                />
            );

            expect(document.querySelector('#canMove')).toHaveTextContent('true');
            expect(document.querySelector('#title')).toHaveTextContent('Move 2 Samples');
            expect(document.querySelector('.alert')).toBeInTheDocument();
            expect(document.querySelector('#message')).toHaveTextContent(
                "You've selected 3 samples but only 2 can be moved. 1 sample cannot be moved because it may have been deleted."
            );
        });

        test('some allowed, some deleted, some not allowed', () => {
            const confirmationData = new OperationConfirmationData({
                allowed: [{ rowId: 1 }],
                notAllowed: [{ rowId: 3 }],
                notPermitted: [],
            });

            renderWithAppContext(
                <TestMoveConfirmationProperties
                    confirmationData={confirmationData}
                    nounPlural={nounPlural}
                    nounSingular={nounSingular}
                    selectedCount={3}
                />
            );

            expect(document.querySelector('#canMove')).toHaveTextContent('true');
            expect(document.querySelector('#title')).toHaveTextContent('Move 1 Sample');
            expect(document.querySelector('.alert')).toBeInTheDocument();
            expect(document.querySelector('#message')).toHaveTextContent(
                "You've selected 3 samples but only 1 can be moved. 2 samples cannot be moved because they have a status or related data that prevents moving, or they may have been deleted."
            );
        });

        test('some allowed, some deleted, some not permitted', () => {
            const confirmationData = new OperationConfirmationData({
                allowed: [{ rowId: 1 }, { rowId: 3 }],
                notAllowed: [],
                notPermitted: [{ rowId: 3 }],
            });

            renderWithAppContext(
                <TestMoveConfirmationProperties
                    confirmationData={confirmationData}
                    nounPlural={nounPlural}
                    nounSingular={nounSingular}
                    selectedCount={3}
                />
            );

            expect(document.querySelector('#canMove')).toHaveTextContent('true');
            expect(document.querySelector('#title')).toHaveTextContent('Move 1 Sample');
            expect(document.querySelector('.alert')).toBeInTheDocument();
            expect(document.querySelector('#message')).toHaveTextContent(
                "You've selected 3 samples but only 1 can be moved. 2 samples cannot be moved because you lack the proper permissions, or they may have been deleted."
            );
        });

        test('some allowed, some deleted, some not allowed, some not permitted', () => {
            const confirmationData = new OperationConfirmationData({
                allowed: [{ rowId: 1 }, { rowId: 4 }],
                notAllowed: [{ rowId: 3 }],
                notPermitted: [{ rowId: 4 }],
            });

            renderWithAppContext(
                <TestMoveConfirmationProperties
                    confirmationData={confirmationData}
                    nounPlural={nounPlural}
                    nounSingular={nounSingular}
                    selectedCount={4}
                />
            );

            expect(document.querySelector('#canMove')).toHaveTextContent('true');
            expect(document.querySelector('#title')).toHaveTextContent('Move 1 Sample');
            expect(document.querySelector('.alert')).toBeInTheDocument();
            expect(document.querySelector('#message')).toHaveTextContent(
                "You've selected 4 samples but only 1 can be moved. 3 samples cannot be moved because you lack the proper permissions, they have a status or related data that prevents moving, or they may have been deleted."
            );
        });

        test('all deleted', () => {
            const confirmationData = new OperationConfirmationData({
                allowed: [],
                notAllowed: [],
                notPermitted: [],
            });

            renderWithAppContext(
                <TestMoveConfirmationProperties
                    confirmationData={confirmationData}
                    nounPlural={nounPlural}
                    nounSingular={nounSingular}
                    selectedCount={3}
                />
            );

            expect(document.querySelector('#canMove')).toHaveTextContent('false');
            expect(document.querySelector('#title')).toHaveTextContent('No Samples Can Be Moved');
            expect(document.querySelector('.alert')).not.toBeInTheDocument();
            expect(document.querySelector('#message')).toHaveTextContent(
                'Cannot move the selected samples, they may have been deleted.'
            );
        });
    });
});
