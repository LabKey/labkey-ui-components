import React from 'react';
import classNames from 'classnames';

interface Props {
    cls?: string;
    collapsedTitle: string;
    expanded: boolean;
    expandedTitle: string;
    highlighted?: boolean;
    id: string;
    onClick: (event) => void;
}

export class FieldExpansionToggle extends React.Component<Props, any> {
    render() {
        const { expanded, expandedTitle, collapsedTitle, cls, highlighted, id, onClick } = this.props;
        const className = classNames('fa fa-lg', {
            'field-highlighted': highlighted && !expanded,
            'fa-chevron-down': expanded,
            'fa-chevron-right': !expanded,
        });

        return (
            <div
                title={expanded ? expandedTitle : collapsedTitle}
                className={'field-icon ' + (cls ? cls : '')}
                id={id}
                onClick={onClick}
            >
                <span className={className} />
            </div>
        );
    }
}
