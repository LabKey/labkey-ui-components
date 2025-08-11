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
            "The sample you've selected cannot be moved because it has a status that prevents moving or you lack the proper permissions."
        );
    });

    interface TestMoveConfirmationPropertiesProps {
        confirmationData: OperationConfirmationData;
        nounPlural: string;
        nounSingular: string;
    }

    // This component is necessary because getMoveConfirmationProperties renders a HelpLink, which uses useServerContext
    // so we need to be able to render something with renderWithAppContext
    const TestMoveConfirmationProperties: FC<TestMoveConfirmationPropertiesProps> = props => {
        const { confirmationData, nounPlural, nounSingular } = props;
        const moveProps = getMoveConfirmationProperties(confirmationData, nounSingular, nounPlural);

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
                />
            );
            expect(document.querySelector('#canMove')).toHaveTextContent('false');
            expect(document.querySelector('#title')).toHaveTextContent('Cannot Move Sample');

            expect(document.querySelector('#message')).toHaveTextContent(
                "The sample you've selected cannot be moved because it has a status that prevents moving or you lack the proper permissions."
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
                />
            );
            expect(document.querySelector('#canMove')).toHaveTextContent('false');
            expect(document.querySelector('#title')).toHaveTextContent('No Samples Can Be Moved');

            expect(document.querySelector('.alert')).toBeNull();
            expect(document.querySelector('#message')).toHaveTextContent(
                "Neither of the 2 samples you've selected can be moved because they have a status that prevents moving or you lack the proper permissions."
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
                />
            );

            expect(document.querySelector('#canMove')).toHaveTextContent('true');
            expect(document.querySelector('#title')).toHaveTextContent('Move 1 Sample');
            expect(document.querySelector('.alert')).toHaveTextContent(
                "You've selected 2 samples but only 1 can be moved. 1 sample cannot be moved because it has status that prevents moving."
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
                />
            );

            expect(document.querySelector('#canMove')).toHaveTextContent('true');
            expect(document.querySelector('#title')).toHaveTextContent('Move 2 Samples');

            expect(document.querySelector('.alert')).toHaveTextContent(
                "You've selected 4 samples but only 2 can be moved. 2 samples cannot be moved because they have status that prevents moving."
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
                />
            );

            expect(document.querySelector('#canMove')).toHaveTextContent('true');
            expect(document.querySelector('#title')).toHaveTextContent('Move 2 Samples');
            expect(document.querySelector('.alert')).toHaveTextContent(
                "You've selected 4 samples but only 2 can be moved. 2 samples cannot be moved because they have status that prevents moving. Selection includes 1 sample that you do not have permission to move."
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
                />
            );

            expect(document.querySelector('#canMove')).toHaveTextContent('true');
            expect(document.querySelector('#title')).toHaveTextContent('Move 2 Samples');
            expect(document.querySelector('.alert')).toHaveTextContent(
                "You've selected 3 samples but only 2 can be moved. Selection includes 1 sample that you do not have permission to move."
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
                />
            );

            expect(document.querySelector('#canMove')).toHaveTextContent('true');
            expect(document.querySelector('#title')).toHaveTextContent('Move 2 Samples');

            expect(document.querySelector('.alert')).toHaveTextContent(
                "You've selected 5 samples but only 2 can be moved. 2 samples cannot be moved because they have status that prevents moving. Selection includes 2 samples that you do not have permission to move."
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
                />
            );

            expect(document.querySelector('#canMove')).toHaveTextContent('false');
            expect(document.querySelector('#title')).toHaveTextContent('No Samples Can Be Moved');
            expect(document.querySelector('.alert')).not.toBeInTheDocument();
            expect(document.querySelector('#message')).toHaveTextContent(
                "You don't have the required permission to move the selected samples."
            );
        });
    });
});
