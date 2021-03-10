import React, { FC, memo, useEffect, useState } from 'react';

import { Alert, LoadingSpinner } from '../../..';

import { PathModel } from './models';
import { fetchAlternatePaths } from './actions';
import { ConceptPathDisplay } from './ConceptPath';

export interface ConceptPathInfoProps {
    selectedCode?: string;
    selectedPath?: PathModel;
    alternatePathClickHandler?: (path: PathModel) => void;
}

export const ConceptPathInfo: FC<ConceptPathInfoProps> = memo(props => {
    const { selectedCode } = props;
    const [error, setError] = useState<string>();
    const [alternatePaths, setAlternatePaths] = useState<PathModel[]>();

    useEffect(() => {
        if (selectedCode) {
            fetchAlternatePaths(selectedCode)
                .then(response => {
                    setAlternatePaths(response);
                })
                .catch(reason => {
                    setError('Unable to load alternate concept paths: ' + reason.exception);
                    setAlternatePaths([]);
                });
        }
    }, [selectedCode, setAlternatePaths]);

    return (
        <>
            <Alert>{error}</Alert>
            <ConceptPathInfoImpl alternatePaths={alternatePaths} {...props} />
        </>
    );
});

interface ConceptPathInfoImplProps extends ConceptPathInfoProps {
    alternatePaths?: PathModel[];
}

export const ConceptPathInfoImpl: FC<ConceptPathInfoImplProps> = memo(props => {
    const { selectedCode, selectedPath, alternatePaths } = props;

    if (!selectedCode) {
        return <div className="none-selected">No concept selected</div>;
    }

    return (
        <div className="concept-pathinfo-container">
            {selectedPath && <div className="title">{selectedPath.label}</div>}
            {!alternatePaths && <LoadingSpinner msg="Loading path information for concept..." />}
            {alternatePaths?.length === 0 && <div className="no-path-info">No path information available</div>}
            {alternatePaths?.length > 0 && <AlternatePathPanel {...props} />}
        </div>
    );
});

const AlternatePathPanel: FC<ConceptPathInfoImplProps> = memo(props => {
    const { selectedPath, alternatePaths, alternatePathClickHandler } = props;

    const altPaths = alternatePaths.filter(path => path.path !== selectedPath?.path);

    return (
        <>
            {selectedPath && (
                <div className="current-path-container">
                    <div className="title">Current Path</div>
                    <ConceptPathDisplay key={selectedPath.path} path={selectedPath} isSelected={true} />
                </div>
            )}
            <div className="alternate-paths-container">
                <div className="title">Alternate Paths</div>
                {altPaths?.length === 0 && <div>No alternate paths</div>}
                {altPaths?.map(path => (
                    <ConceptPathDisplay key={path.path} path={path} onClick={alternatePathClickHandler} />
                ))}
            </div>
        </>
    );
});
