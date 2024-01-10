import { useEffect, useState } from 'react';

import { getFolderDataTypeExclusions } from '../entities/actions';
import { resolveErrorMessage } from '../../util/messaging';
import { Container } from '../base/models/Container';

export const useFolderDataTypeExclusions = (
    project: Container
): { loaded: boolean; error: string; disabledTypesMap: Record<string, number[]> } => {
    const [loaded, setLoaded] = useState<boolean>(false);
    const [error, setError] = useState<string>();
    const [disabledTypesMap, setDisabledTypesMap] = useState<Record<string, number[]>>();

    useEffect(() => {
        (async () => {
            setLoaded(false);
            setError(undefined);

            try {
                if (project) {
                    const disabledTypesMap_ = await getFolderDataTypeExclusions(project?.path);
                    setDisabledTypesMap(disabledTypesMap_);
                } else {
                    setDisabledTypesMap({});
                }
            } catch (e) {
                setError(`Error: ${resolveErrorMessage(e)}`);
            } finally {
                setLoaded(true);
            }
        })();
    }, [project]);

    return { loaded, error, disabledTypesMap };
};
