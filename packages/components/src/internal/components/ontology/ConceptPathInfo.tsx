import React, { FC, memo, useEffect, useState } from 'react';

import classNames from 'classnames';

import { Alert, LoadingSpinner } from '../../..';

import { PathModel } from './models';
import { fetchAlternatePaths } from './actions';

export interface ConceptPathInfoProps {
    selectedCode?: string;
    selectedPath?: PathModel;
}

// interface ConceptPathInfoImplProps {
//     path: PathModel;
//     selected?: boolean;
// }

// export const ConceptPathInfoImpl: FC<ConceptPathInfoImplProps> = memo(props => {
//     const { path, selected = false } = props;
//
//     return ;
// });

export const ConceptPathInfo: FC<ConceptPathInfoProps> = memo(props => {
    const { selectedCode, selectedPath } = props;
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
    }, [selectedCode, alternatePaths, setAlternatePaths]);

    return (
        <ConceptPathInfoImpl code={selectedCode} error={error} alternatePaths={alternatePaths} selectedPath={selectedPath} />
    );
});

interface ConceptPathInfoImplProps {
    code: string;
    selectedPath?: PathModel;
    alternatePaths?: PathModel[];
    error?: string;
}

export const ConceptPathInfoImpl: FC<ConceptPathInfoImplProps> = memo(props => {
    const { code, selectedPath = undefined, error, alternatePaths } = props;

    if (!code) {
        return <div className="none-selected">No concept selected</div>;
    }

    return (
        <>
            <Alert>{error}</Alert>
            {!alternatePaths && <LoadingSpinner msg="Loading path information for concept..."/>}
            {alternatePaths && alternatePaths.length > 0 && (
                <div className="concept-paths-container">
                    {alternatePaths.map(path => (
                        <div key={path.path} className={classNames({
                            selected: selectedPath?.path === path.path,
                            'concept-path': true
                        })}>{path.pathLabel}</div>
                    ))}
                </div>
            )}
            {alternatePaths?.length === 0 && <div>No concept selected</div>}
        </>
    );
});
