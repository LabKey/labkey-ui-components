/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { createContext, FC, useContext, useMemo } from 'react';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { Modal } from '../../Modal';
import { ModalRendererProps, resolveModalRenderer } from '../../ModalRenderFactory';

const AddEntitiesModalContext = createContext<boolean>(true);

export function useIsAddEntitiesEnabled(schemaQuery: SchemaQuery): boolean {
    const addEntitiesEnabled = useContext(AddEntitiesModalContext);
    return useMemo(
        // If the context it not available/rendered, then default to true
        () =>
            schemaQuery !== undefined &&
            (addEntitiesEnabled ?? true) &&
            resolveModalRenderer(schemaQuery) !== undefined,
        [addEntitiesEnabled, schemaQuery]
    );
}

interface AddEntitiesMenuFooterProps {
    onClick: () => void;
}

export const AddEntitiesFooter: FC<AddEntitiesMenuFooterProps> = ({ onClick }) => (
    <div className="add-entities-footer" onClick={onClick}>
        <span className="fa fa-plus-circle" />
        Add New
    </div>
);
AddEntitiesFooter.displayName = 'AddEntitiesFooter';

export const AddEntitiesModal: FC<ModalRendererProps> = props => {
    const { containerFilter, containerPath, onCancel, onComplete, schemaQuery } = props;
    const ModalRenderer = useMemo(() => resolveModalRenderer(schemaQuery), [schemaQuery]);

    if (!ModalRenderer) {
        return (
            <Modal onCancel={onCancel} title="Add New Entities">
                Add entities modal not registered for {schemaQuery.schemaName}.{schemaQuery.queryName}
            </Modal>
        );
    }

    return (
        <AddEntitiesModalContext.Provider value={false}>
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
