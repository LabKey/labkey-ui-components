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
            <ConceptPathInfoImpl code={selectedCode} alternatePaths={alternatePaths} {...props} />;
        </>
    );
});

interface ConceptPathInfoImplProps {
    code: string;
    alternatePaths?: PathModel[];

    selectedPath?: PathModel;
    alternatePathClickHandler?: (path: PathModel) => void;
}

export const ConceptPathInfoImpl: FC<ConceptPathInfoImplProps> = memo(props => {
    const { code, selectedPath, alternatePaths, alternatePathClickHandler } = props;

    if (!code) {
        return <div className="none-selected">No concept selected</div>;
    }

    return (
        <div className="concept-pathinfo-container">
            {selectedPath && <div className="title">{selectedPath.label}</div>}
            {!alternatePaths && <LoadingSpinner msg="Loading path information for concept..." />}
            {alternatePaths && alternatePaths.length > 0 && (
                <>
                    {selectedPath && (
                        <div className="current-path-container">
                            <div className="title">Current Path</div>
                            <ConceptPathDisplay key={selectedPath.path} path={selectedPath} isSelected={true} />
                        </div>
                    )}
                    <div className="alternate-paths-container">
                        <div className="title">Alternate Paths</div>
                        {alternatePaths
                            .filter(path => path.path !== selectedPath?.path)
                            .map(path => (
                                <ConceptPathDisplay key={path.path} path={path} onClick={alternatePathClickHandler} />
                            ))}
                    </div>
                </>
            )}
            {alternatePaths?.length === 0 && <div className="no-path-info">No path information available</div>}
        </div>
    );
});
