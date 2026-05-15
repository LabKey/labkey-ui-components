import React, { act } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { List } from 'immutable';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { AppContextTestProviderProps } from '../../test/testHelpers';
import { getTestAPIWrapper } from '../../APIWrapper';

import { ChatMessage, ChatRole } from '../mcp/models';

import { DomainField } from './models';
import { getDomainPropertiesTestAPIWrapper } from './APIWrapper';
import {
    EXPR_ASST_METRIC_FEATURE_AREA,
    ExpressionAssistantModal,
    ExpressionAssistantModalProps,
} from './ExpressionAssistantModal';

// Capture the props ChatModal is rendered with so we can drive ExpressionAssistantModal's logic
// without depending on ChatModal's UI internals.
let chatModalProps: any;
jest.mock('../mcp/ChatModal', () => ({
    __esModule: true,
    ChatModal: (props: any) => {
        chatModalProps = props;
        return <div data-testid="chat-modal-mock" />;
    },
}));

const abortRequest = jest.fn();
const resetRequestHandler = jest.fn();
jest.mock('../../util/RequestHandler', () => ({
    useRequestHandler: () => ({
        abortRequest,
        requestHandler: { current: undefined },
        resetRequestHandler,
    }),
}));

const incrementMetric = jest.fn();
jest.mock('../../actions', () => ({
    incrementClientSideMetricCount: (...args: any[]) => incrementMetric(...args),
}));

function makeField(name: string, rangeURI = 'http://www.w3.org/2001/XMLSchema#string', phi?: string): DomainField {
    return DomainField.create({ name, rangeURI, PHI: phi });
}

const DEFAULT_FIELDS = [makeField('A'), makeField('B', 'http://www.w3.org/2001/XMLSchema#int')];
function getDomainFields(fields = DEFAULT_FIELDS) {
    return () => ({
        domainFields: List<DomainField>(fields),
        systemFields: [] as any[],
    });
}

function defaultProps(overrides?: Partial<ExpressionAssistantModalProps>): ExpressionAssistantModalProps {
    return {
        getDomainFields: getDomainFields(),
        onCancel: jest.fn(),
        ...overrides,
    };
}

function makeApiContext(expressionAssistant = jest.fn()): AppContextTestProviderProps {
    return {
        appContext: {
            api: getTestAPIWrapper(jest.fn, {
                domain: getDomainPropertiesTestAPIWrapper(jest.fn, { expressionAssistant }),
            }),
        },
    };
}

beforeEach(() => {
    chatModalProps = undefined;
    abortRequest.mockClear();
    resetRequestHandler.mockClear();
    incrementMetric.mockClear();
});

describe('ExpressionAssistantModal', () => {
    describe('initial intro message', () => {
        test('shows the NEW intro when there is no expression or error', () => {
            // Arrange
            const expressionAssistant = jest.fn();

            // Act
            renderWithAppContext(<ExpressionAssistantModal {...defaultProps()} />, makeApiContext(expressionAssistant));

            // Assert - one assistant intro message with the NEW prompt text and no SQL segment
            const messages = chatModalProps.messages as ChatMessage[];
            expect(messages).toHaveLength(1);
            expect(messages[0].role).toBe(ChatRole.assistant);
            expect(messages[0].text).toMatch(/^Explain the calculation you would like/);
            expect(messages[0].segments).toBeUndefined();
            expect(expressionAssistant).not.toHaveBeenCalled();
        });

        test('shows the CHANGE intro with a SQL segment when fieldExpression is provided', () => {
            // Arrange / Act
            renderWithAppContext(
                <ExpressionAssistantModal {...defaultProps()} fieldExpression="SELECT 1" />,
                makeApiContext()
            );

            // Assert - intro begins with the CHANGE prompt and includes a sql segment containing the existing expression
            const intro = (chatModalProps.messages as ChatMessage[])[0];
            expect(intro.text).toMatch(/^Explain how you would like to change this calculation/);
            expect(intro.segments).toEqual([{ type: 'sql', sql: 'SELECT 1' }]);
        });

        test('shows the VALIDATE intro when fieldError is provided and triggers auto-evaluation', async () => {
            // Arrange
            const expressionAssistant = jest.fn().mockResolvedValue({
                conversationId: 'conv-1',
                success: true,
                text: 'Looks like a syntax error.',
            });

            // Act
            renderWithAppContext(
                <ExpressionAssistantModal {...defaultProps()} fieldError="boom" fieldExpression="SELECT bad" />,
                makeApiContext(expressionAssistant)
            );

            // Assert - intro is VALIDATE text, and expressionAssistant was auto-invoked with an empty prompt plus the
            // structured context fields. Server-side composePrompt synthesizes the "evaluate this expression" turn.
            await waitFor(() => {
                const m = chatModalProps.messages as ChatMessage[];
                expect(m[m.length - 1].text).toBe('Looks like a syntax error.');
            });
            const messages = chatModalProps.messages as ChatMessage[];
            expect(messages[0].text).toBe('Let me take a look at this expression and see how I can help.');
            expect(expressionAssistant).toHaveBeenCalledTimes(1);
            const callArg = expressionAssistant.mock.calls[0][0];
            expect(callArg.prompt).toBe('');
            expect(callArg.fieldError).toBe('boom');
            expect(callArg.fieldExpression).toBe('SELECT bad');
            expect(callArg.domainFields).toBeDefined();
            expect(callArg.conversationId).toBeUndefined();
        });
    });

    describe('sendPrompt', () => {
        test('first user prompt sends the bare text plus first-turn context; follow-up turns drop the context', async () => {
            // Arrange
            const expressionAssistant = jest
                .fn()
                .mockResolvedValueOnce({ conversationId: 'c1', success: true, text: 'first reply' })
                .mockResolvedValueOnce({ conversationId: 'c1', success: true, text: 'second reply' });
            renderWithAppContext(<ExpressionAssistantModal {...defaultProps()} />, makeApiContext(expressionAssistant));

            // Act - first prompt
            act(() => {
                chatModalProps.sendPrompt('compute sum of A');
            });
            // Assert - prompt is the user's text verbatim; domainFields rides alongside; conversationId is absent
            await waitFor(() => {
                const m = chatModalProps.messages as ChatMessage[];
                expect(m[m.length - 1].text).toBe('first reply');
            });
            const firstCall = expressionAssistant.mock.calls[0][0];
            expect(firstCall.prompt).toBe('compute sum of A');
            expect(firstCall.domainFields).toBeDefined();
            expect(firstCall.conversationId).toBeUndefined();
            const messagesAfterFirst = chatModalProps.messages as ChatMessage[];
            expect(messagesAfterFirst.find(m => m.role === ChatRole.user)?.text).toBe('compute sum of A');
            expect(incrementMetric).toHaveBeenCalledWith(EXPR_ASST_METRIC_FEATURE_AREA, 'submitPrompt');

            // Act - second prompt with a conversationId set from the first response
            act(() => {
                chatModalProps.sendPrompt('and also B');
            });
            // Assert - bare prompt, no first-turn context fields, and the previously returned conversationId
            await waitFor(() => {
                const m = chatModalProps.messages as ChatMessage[];
                expect(m[m.length - 1].text).toBe('second reply');
            });
            const secondCall = expressionAssistant.mock.calls[1][0];
            expect(secondCall.prompt).toBe('and also B');
            expect(secondCall.conversationId).toBe('c1');
            expect(secondCall.domainFields).toBeUndefined();
            expect(secondCall.fieldExpression).toBeUndefined();
            expect(secondCall.fieldError).toBeUndefined();
        });

        test('passes columnMap and PHI columns derived from the provided domain fields', async () => {
            // Arrange
            const fields = [
                makeField('plain', 'http://www.w3.org/2001/XMLSchema#string'),
                makeField('secret', 'http://www.w3.org/2001/XMLSchema#string', 'Restricted'),
            ];
            const expressionAssistant = jest.fn().mockResolvedValue({ conversationId: 'c', success: true, text: 'ok' });
            renderWithAppContext(
                <ExpressionAssistantModal getDomainFields={getDomainFields(fields)} onCancel={jest.fn()} />,
                makeApiContext(expressionAssistant)
            );

            // Act
            act(() => {
                chatModalProps.sendPrompt('go');
            });

            // Assert - columnMap contains both field names and phiColumns lists only the PHI-tagged column
            await waitFor(() => expect(expressionAssistant).toHaveBeenCalledTimes(1));
            const arg = expressionAssistant.mock.calls[0][0];
            expect(Object.keys(arg.columnMap)).toEqual(expect.arrayContaining(['plain', 'secret']));
            expect(arg.phiColumns).toEqual(['secret']);
        });

        test('non-success response surfaces the response error in the appended message', async () => {
            // Arrange
            const expressionAssistant = jest
                .fn()
                .mockResolvedValue({ conversationId: 'c', success: false, error: 'rate limited' });
            renderWithAppContext(<ExpressionAssistantModal {...defaultProps()} />, makeApiContext(expressionAssistant));

            // Act
            act(() => {
                chatModalProps.sendPrompt('go');
            });

            // Assert - the assistant reply carries the response error and isPending settles to false
            await waitFor(() => {
                const m = chatModalProps.messages as ChatMessage[];
                expect(m[m.length - 1].error).toBe('rate limited');
            });
            expect(chatModalProps.isPending).toBe(false);
        });

        test('thrown non-abort error appends a generic failure message', async () => {
            // Arrange - error with truthy status simulates a non-abort failure
            const expressionAssistant = jest.fn().mockRejectedValue(Object.assign(new Error('nope'), { status: 500 }));
            renderWithAppContext(<ExpressionAssistantModal {...defaultProps()} />, makeApiContext(expressionAssistant));

            // Act
            act(() => {
                chatModalProps.sendPrompt('go');
            });

            // Assert - appended assistant message uses the generic failure text and not the raw exception
            await waitFor(() => {
                const m = chatModalProps.messages as ChatMessage[];
                expect(m[m.length - 1].error).toBe('Request failed. Please try again.');
            });
            expect(chatModalProps.isPending).toBe(false);
            expect(incrementMetric).not.toHaveBeenCalled();
        });

        test('aborted request (falsy status) does not append a message and leaves isPending true', async () => {
            // Arrange - status undefined / 0 marks an abort
            const expressionAssistant = jest.fn().mockRejectedValue(Object.assign(new Error('aborted'), { status: 0 }));
            renderWithAppContext(<ExpressionAssistantModal {...defaultProps()} />, makeApiContext(expressionAssistant));
            const initialMessageCount = (chatModalProps.messages as ChatMessage[]).length;

            // Act
            let sendPromise: Promise<void>;
            act(() => {
                sendPromise = chatModalProps.sendPrompt('go');
            });

            // Assert - only the user prompt was appended (no error/response message), and isPending was NOT reset
            await waitFor(() => expect(expressionAssistant).toHaveBeenCalledTimes(1));
            await sendPromise;
            const messages = chatModalProps.messages as ChatMessage[];
            expect(messages.length).toBe(initialMessageCount + 1);
            expect(messages[messages.length - 1].role).toBe(ChatRole.user);
            expect(chatModalProps.isPending).toBe(true);
        });
    });

    describe('onInterrupt', () => {
        test('user-initiated interrupt aborts the request and appends a "Stopped." assistant message', async () => {
            // Arrange
            renderWithAppContext(<ExpressionAssistantModal {...defaultProps()} />, makeApiContext());

            // Act
            act(() => {
                chatModalProps.onInterrupt(true);
            });

            // Assert - abortRequest fired and a "Stopped." assistant message was appended
            await waitFor(() => {
                const m = chatModalProps.messages as ChatMessage[];
                expect(m[m.length - 1]).toMatchObject({ role: ChatRole.assistant, text: 'Stopped.' });
            });
            expect(abortRequest).toHaveBeenCalledTimes(1);
        });

        test('non-user interrupt aborts without appending a message', async () => {
            // Arrange
            renderWithAppContext(<ExpressionAssistantModal {...defaultProps()} />, makeApiContext());
            const initialCount = (chatModalProps.messages as ChatMessage[]).length;

            // Act
            act(() => {
                chatModalProps.onInterrupt(false);
            });

            // Assert - abort fired, no new message appended
            expect(abortRequest).toHaveBeenCalledTimes(1);
            expect((chatModalProps.messages as ChatMessage[]).length).toBe(initialCount);
        });
    });

    describe('renderSegment / SqlExpression', () => {
        test('expression segments render an Apply Expression action that calls onComplete with the SQL', () => {
            // Arrange
            const onComplete = jest.fn();
            renderWithAppContext(
                <ExpressionAssistantModal {...defaultProps()} onComplete={onComplete} />,
                makeApiContext()
            );
            // Render the segment ourselves into a container so we can interact with it
            const node = chatModalProps.renderSegment({ type: 'expression', sql: 'SELECT 1' }, 0);

            // Act
            const { unmount } = render(<div>{node}</div>);
            fireEvent.click(screen.getByRole('button', { name: /apply expression/i }));

            // Assert - the SQL is shown and clicking Apply forwards the expression to onComplete
            expect(screen.getByText('SELECT 1')).toBeInTheDocument();
            expect(onComplete).toHaveBeenCalledTimes(1);
            expect(onComplete).toHaveBeenCalledWith('SELECT 1');
            unmount();
        });

        test('sql segments render read-only without an Apply action', () => {
            // Arrange
            renderWithAppContext(
                <ExpressionAssistantModal {...defaultProps()} onComplete={jest.fn()} />,
                makeApiContext()
            );
            const node = chatModalProps.renderSegment({ type: 'sql', sql: 'SELECT 2' }, 0);

            // Act
            render(<div>{node}</div>);

            // Assert - SQL text is rendered, but the Apply Expression action is not available
            expect(screen.getByText('SELECT 2')).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /apply expression/i })).not.toBeInTheDocument();
        });

        test('expression segment without onComplete still renders read-only', () => {
            // Arrange - omit onComplete
            renderWithAppContext(<ExpressionAssistantModal {...defaultProps()} />, makeApiContext());
            const node = chatModalProps.renderSegment({ type: 'expression', sql: 'SELECT 3' }, 0);

            // Act
            render(<div>{node}</div>);

            // Assert - SQL still renders, but there is no Apply action when no onComplete is supplied
            expect(screen.getByText('SELECT 3')).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /apply expression/i })).not.toBeInTheDocument();
        });

        test('unknown / empty segments return undefined so ChatModal falls back to default rendering', () => {
            // Arrange
            renderWithAppContext(<ExpressionAssistantModal {...defaultProps()} />, makeApiContext());

            // Act & Assert - both unrecognized type and missing SQL return undefined
            expect(chatModalProps.renderSegment({ type: 'text', text: 'hello' }, 0)).toBeUndefined();
            expect(chatModalProps.renderSegment({ type: 'expression' }, 0)).toBeUndefined();
            expect(chatModalProps.renderSegment({ type: 'sql' }, 0)).toBeUndefined();
        });
    });

    test('passes through onCancel to the chat modal', () => {
        // Arrange
        const onCancel = jest.fn();

        // Act
        renderWithAppContext(<ExpressionAssistantModal {...defaultProps()} onCancel={onCancel} />, makeApiContext());

        // Assert - onCancel is wired straight through to ChatModal, so closing the modal invokes the caller's handler
        expect(chatModalProps.onCancel).toBe(onCancel);
        expect(chatModalProps.title).toBe('Expression AI Assistant');
    });
});
