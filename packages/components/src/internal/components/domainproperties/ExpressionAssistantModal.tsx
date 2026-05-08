import React, { FC, memo, useCallback } from 'react';
import { DomainField } from './models';
import { ChatModal } from '../mcp/ChatModal';
import { useAppContext } from '../../AppContext';

interface Props {
    field: DomainField;
    onCancel: () => void;
}

export const ExpressionAssistantModal: FC<Props> = memo(({ field, onCancel }) => {
    const { api } = useAppContext();

    const onSubmit = useCallback(
        async (prompt: string) => {
            try {
                const beep = await api.query.expressionAssist(prompt);
            } catch (e) {

            }
        },
        [api]
    );

    return <ChatModal onCancel={onCancel} onSubmit={onSubmit} title="Expression AI Assistant" />;
});
ExpressionAssistantModal.displayName = 'ExpressionAssistantModal';
