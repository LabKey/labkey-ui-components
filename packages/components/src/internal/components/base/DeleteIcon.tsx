import React, { FC, memo, useCallback } from 'react';
import { useEnterEscape } from '../../../public/useEnterEscape';

interface Props {
    className?: string;
    iconCls: string;
    id?: string;
    onDelete: () => void;
    title: string;
}

export const DeleteIcon: FC<Props> = memo(({ id, title, className = 'field-icon', onDelete, iconCls }) => {
    const callOnDelete = useCallback(() => {
        onDelete();
    }, [onDelete]);
    const onKeyDown = useEnterEscape(callOnDelete);

    return (
        <span className={className} id={id} onClick={callOnDelete} onKeyDown={onKeyDown} tabIndex={0} title={title}>
            <span className={`fa fa-times-circle ${iconCls}`} />
        </span>
    );
});
DeleteIcon.displayName = 'DeleteIcon';
