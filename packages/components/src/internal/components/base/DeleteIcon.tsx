import React, { FC, memo } from 'react';
import { useEnterEscape } from '../../../public/useEnterEscape';

interface Props {
    className?: string;
    iconCls: string;
    id?: string;
    onDelete: (event) => void;
    title: string;
}

export const DeleteIcon: FC<Props> = memo(({ id, title, className = 'field-icon', onDelete, iconCls }) => {
    const onKeyDown = useEnterEscape(onDelete);
    return (
        <span className={className} id={id} onClick={onDelete} onKeyDown={onKeyDown} tabIndex={0} title={title}>
            <span className={`fa fa-times-circle ${iconCls}`} />
        </span>
   );
});
DeleteIcon.displayName = 'DeleteIcon';
