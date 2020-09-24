import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinusSquare, faPlusSquare } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';

interface Props {
    cls?: string;
    expanded: boolean;
    highlighted?: boolean;
    expandedTitle: string;
    collapsedTitle: string;
    id: string;
    onClick: (event) => void;
}

export class FieldExpansionToggle extends React.Component<Props, any> {
    render() {
        const { expanded, expandedTitle, collapsedTitle, cls, highlighted, id, onClick } = this.props;
        const className =
            highlighted !== undefined
                ? classNames({
                      'field-highlighted': highlighted && !expanded,
                      'field-not-highlighted': !highlighted,
                  })
                : undefined;

        return (
            <div
                title={expanded ? expandedTitle : collapsedTitle}
                className={'field-icon ' + (cls ? cls : '')}
                id={id}
                onClick={onClick}
            >
                <FontAwesomeIcon size="lg" className={className} icon={expanded ? faMinusSquare : faPlusSquare} />
            </div>
        );
    }
}
