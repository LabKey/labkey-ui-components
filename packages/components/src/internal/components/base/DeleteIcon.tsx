import React, { FC, memo } from 'react';

interface Props {
    iconCls?: string;
    id?: string;
    onDelete: (event) => void;
    title?: string;
}

export const DeleteIcon: FC<Props> = memo(({ id, title = 'Delete this item', onDelete, iconCls = 'field-delete' }) => (
    <span id={id} title={title} className="field-icon" onClick={onDelete}>
        <span className={`fa fa-times-circle ${iconCls}`} />
    </span>
));
