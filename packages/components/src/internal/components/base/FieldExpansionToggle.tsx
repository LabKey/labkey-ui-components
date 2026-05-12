import React, { FC } from 'react';
import classNames from 'classnames';
import { useEnterEscape } from '../../../public/useEnterEscape';

interface Props {
    cls?: string;
    collapsedTitle: string;
    expanded: boolean;
    expandedTitle: string;
    highlighted?: boolean;
    id: string;
    onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export const FieldExpansionToggle: FC<Props> = props => {
    const { expanded, expandedTitle, collapsedTitle, cls, highlighted, id, onClick } = props;
    const className = classNames('fa fa-lg', {
        'field-highlighted': highlighted && !expanded,
        'fa-chevron-down': expanded,
        'fa-chevron-right': !expanded,
    });
    const onKeyDown = useEnterEscape(onClick);

    return (
        <div
            className={'field-icon ' + (cls ? cls : '')}
            id={id}
            onClick={onClick}
            onKeyDown={onKeyDown}
            tabIndex={0}
            title={expanded ? expandedTitle : collapsedTitle}
        >
            <span className={className} />
        </div>
    );
};
FieldExpansionToggle.displayName = 'FieldExpansionToggle';
