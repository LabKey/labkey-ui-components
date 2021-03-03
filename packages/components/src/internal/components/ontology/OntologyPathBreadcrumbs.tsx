import React, { FC, memo } from 'react';
import { Label } from 'react-bootstrap';
import classNames from 'classnames';

export interface OntologyPathBreadcrumbProps {
    title: string;
    selectedPath: string[];
    isSelected?: boolean;
}

// function getTitlePrefix(): string {
//     let prefix = this.props.titlePrefix;
//
//     // ellipsis after certain length
//     if (prefix && prefix.length > 70) {
//         prefix = prefix.substr(0, 70) + '...';
//     }
//
//     return prefix ? prefix + ' - ' : '';
// }

export const OntologyPathBreadcrumb: FC<OntologyPathBreadcrumbProps> = memo( props => {
    const { title, selectedPath, isSelected = false } = props;

    if (!selectedPath) return undefined;

    const pathDisplay = selectedPath.map(path => {
        return (
            <>
                <span>{path}</span>
                <span className="ontology-path-breadcrumb-spacer">{' > '}</span>
            </>
        );
    });

    return (
        <>
            <div className={classNames({ 'ontology-path-breadcrumb-container': true, selected: isSelected })}>
                <div className="title">{title}</div>
                <div className="ontology-path-breadcrumb" dir="rtl">
                    {pathDisplay}
                </div>
            </div>
        </>
    );
});
