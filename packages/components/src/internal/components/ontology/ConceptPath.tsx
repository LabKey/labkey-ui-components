import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';

import { PathModel } from './models';

import { Alert } from '../base/Alert';

import { fetchParentPaths } from './actions';

export interface ConceptPathDisplayProps {
    title?: string;
    path: PathModel;
    isSelected?: boolean;
    isCollapsed?: boolean;
    onClick?: (path: PathModel) => void;
}

export const ConceptPathDisplay: FC<ConceptPathDisplayProps> = memo(props => {
    const { path, onClick } = props;
    const [parentPaths, setParentPaths] = useState<PathModel[]>();
    const [error, setError] = useState<string>();

    const updatePath = useCallback((): void => {
        onClick?.(path);
    }, [path, onClick]);

    useEffect(() => {
        fetchParentPaths(path.path)
            .then(response => {
                setParentPaths(response);
            })
            .catch(reason => {
                setError('Unable to load parent paths: ' + reason.exception);
                setParentPaths([]);
            });
    }, [path, setParentPaths, setError]);

    return <ConceptPathDisplayImpl {...props} parentPaths={parentPaths} error={error} onClick={updatePath} />;
});

interface ConceptPathDisplayImplProps {
    readonly title?: string;
    readonly path: PathModel;
    readonly isSelected?: boolean;
    readonly isCollapsed?: boolean;
    readonly onClick?: () => void;

    readonly parentPaths: PathModel[];
    readonly error: string;
}

export const ConceptPathDisplayImpl: FC<ConceptPathDisplayImplProps> = memo(props => {
    const { error, isCollapsed = false, isSelected = false, onClick = undefined, parentPaths, path, title } = props;
    if (!path) return undefined;

    if (error) return <Alert>{error}</Alert>;

    return (
        <>
            <div
                className={classNames({
                    'concept-path-container': true,
                    selected: isSelected,
                    collapsed: isCollapsed,
                })}
                onClick={onClick}
            >
                {title && <div className="title">{title}</div>}
                <div className="concept-path">
                    {parentPaths?.length > 0 &&
                        parentPaths.map((parent, idx) => {
                            return (
                                <>
                                    <span className="concept-path-label">{parent.label}</span>
                                    {idx !== parentPaths.length - 1 && <i className="fa fa-chevron-right" />}
                                </>
                            );
                        })}
                </div>
            </div>
        </>
    );
});
