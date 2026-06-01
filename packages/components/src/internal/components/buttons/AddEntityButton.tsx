/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo } from 'react';

import { ActionButton, ActionButtonProps } from './ActionButton';

export interface AddEntityElementProps {
    entity: string;
    isAnother?: boolean;
}

export const AddEntityElement: FC<AddEntityElementProps> = memo(({ entity, isAnother }) => {
    return (
        <>
            <i className="fa fa-plus-circle container--addition-icon" /> Add {isAnother ? ' Another ' : ''}{entity}
        </>
    );
});

AddEntityElement.displayName = 'AddEntityElement';

export interface AddEntityButtonProps extends ActionButtonProps, AddEntityElementProps {}

export const AddEntityButton: FC<AddEntityButtonProps> = memo(({ isAnother, entity, ...actionButtonProps }) => {
    return (
        <ActionButton {...actionButtonProps}>
            <AddEntityElement isAnother={isAnother} entity={entity} />
        </ActionButton>
    );
});

AddEntityButton.displayName = 'AddEntityButton';
