/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { createContext, FC, useContext, useMemo } from 'react';
import classNames from 'classnames';

import { SchemaQuery } from '../../../public/SchemaQuery';
import { Modal } from '../../Modal';
import { ModalRendererProps, resolveModalRenderer } from '../../ModalRenderFactory';

export type AddEntitiesModalContext = {
    addEntitiesEnabled: boolean;
    inModal: boolean;
};

const AddEntitiesModalContext = createContext<AddEntitiesModalContext>({ addEntitiesEnabled: true, inModal: false });

export function useIsAddEntitiesEnabled(schemaQuery: SchemaQuery): boolean {
    const ctx = useContext(AddEntitiesModalContext);
    return useMemo(
        // If the context it not available/rendered, then default to true
        () =>
            schemaQuery !== undefined &&
            (ctx?.addEntitiesEnabled ?? true) &&
            resolveModalRenderer(schemaQuery) !== undefined,
        [ctx, schemaQuery]
    );
}

export function useIsInModal(): boolean {
    const ctx = useContext(AddEntitiesModalContext);
    return !!ctx?.inModal;
}

interface AddEntitiesMenuFooterProps {
    focused?: boolean;
    onClick: () => void;
}

export const AddEntitiesFooter: FC<AddEntitiesMenuFooterProps> = ({ focused, onClick }) => (
    <div
        className={classNames('add-entities-footer', { 'is-focused': focused })}
        onClick={onClick}
        role="button"
        tabIndex={0}
    >
        <span className="fa fa-plus-circle" />
        Add New
    </div>
);
AddEntitiesFooter.displayName = 'AddEntitiesFooter';

export const AddEntitiesModal: FC<ModalRendererProps> = props => {
    const { containerFilter, containerPath, onCancel, onComplete, schemaQuery } = props;
    const ModalRenderer = useMemo(() => resolveModalRenderer(schemaQuery), [schemaQuery]);
    const value = useMemo<AddEntitiesModalContext>(() => ({ addEntitiesEnabled: false, inModal: true }), []);

    if (!ModalRenderer) {
        return (
            <Modal onCancel={onCancel} title="Add New Entities">
                Add entities modal not registered for {schemaQuery.schemaName}.{schemaQuery.queryName}
            </Modal>
        );
    }

    return (
        <AddEntitiesModalContext.Provider value={value}>
            {/* eslint-disable-next-line react-hooks/static-components */}
            <ModalRenderer
                containerFilter={containerFilter}
                containerPath={containerPath}
                onCancel={onCancel}
                onComplete={onComplete}
                schemaQuery={schemaQuery}
            />
        </AddEntitiesModalContext.Provider>
    );
};
AddEntitiesModal.displayName = 'AddEntitiesModal';
