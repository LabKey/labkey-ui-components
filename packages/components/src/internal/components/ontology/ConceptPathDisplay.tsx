/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';

import { Alert } from '../base/Alert';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { PathModel } from './models';
import { fetchParentPaths } from './actions';

export interface ConceptPathDisplayProps {
    isSelected?: boolean;
    onClick?: (path: PathModel, isAlternatePath?: boolean) => void;
    path: PathModel;
    title?: string;
}

export const ConceptPathDisplay: FC<ConceptPathDisplayProps> = memo(props => {
    const { path } = props;
    const [parentPaths, setParentPaths] = useState<PathModel[]>();
    const [error, setError] = useState<string>();

    useEffect(() => {
        if (path) {
            setParentPaths(undefined);
            // FIXME: this should be in an APIWrapper, it's causing console errors in our tests, and was causing
            //  intermittent test failures in ConceptOverviewPanel.spec.tsx
            fetchParentPaths(path.path)
                .then(response => {
                    setParentPaths(response);
                })
                .catch(reason => {
                    setError('Unable to load parent paths: ' + reason?.exception);
                    setParentPaths([]);
                });
        }
    }, [path, setParentPaths, setError]);

    return (
        <>
            <Alert>{error}</Alert>
            {path && <ConceptPathDisplayImpl key={path.path} {...props} parentPaths={parentPaths} />}
        </>
    );
});
ConceptPathDisplay.displayName = 'ConceptPathDisplay';

interface ConceptPathDisplayImplProps extends ConceptPathDisplayProps {
    parentPaths: PathModel[];
}

export const ConceptPathDisplayImpl: FC<ConceptPathDisplayImplProps> = memo(props => {
    const { isSelected = false, onClick = undefined, parentPaths, path, title } = props;
    const updatePath = useCallback((): void => {
        onClick?.(path, true);
    }, [path, onClick]);

    if (!path) return undefined;

    return (
        <div
            className={classNames('concept-path-container', {
                selected: isSelected,
            })}
            onClick={updatePath}
        >
            {title && <div className="title">{title}</div>}
            <div className="concept-path">
                {!parentPaths && <LoadingSpinner />}
                {parentPaths?.map((parent, idx) => {
                    return (
                        <React.Fragment key={parent.path ?? idx}>
                            <span className="concept-path-label">{parent.label}</span>
                            {idx !== parentPaths.length - 1 && (
                                <i className="fa fa-chevron-right concept-path-spacer" />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
});
ConceptPathDisplayImpl.displayName = 'ConceptPathDisplay';
