import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Filter } from '@labkey/api';

import { Alert } from '../base/Alert';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { OntologyBrowserPanel } from './OntologyBrowserPanel';
import { PathModel } from './models';
import { fetchParentPaths, fetchPathModel, getParentsConceptCodePath } from './actions';

interface OntologyBrowserFilterPanelProps {
    ontologyId: string;
    conceptSubtree?: string;
    filterValue: string;
    filterType: Filter.IFilterType;
    onFilterChange: (filterValue: string) => void;
}

function isPathFilter(filterType: Filter.IFilterType): boolean {
    if (!filterType) return false;

    return (
        filterType.getURLSuffix() === Filter.Types.ONTOLOGY_IN_SUBTREE.getURLSuffix() ||
        filterType.getURLSuffix() === Filter.Types.ONTOLOGY_NOT_IN_SUBTREE.getURLSuffix()
    );
}

export const OntologyBrowserFilterPanel: FC<OntologyBrowserFilterPanelProps> = memo(props => {
    const { ontologyId, conceptSubtree, filterType, filterValue, onFilterChange } = props;
    const [subtreePath, setSubtreePath] = useState<PathModel>();
    const [filteredConcepts, setFilteredConcepts] = useState<Map<string, PathModel>>(new Map());
    const [error, setError] = useState<string>();

    const updateFilterValues = useCallback(
        async (filterString: string) => {
            setError(null); // clear any existing errors
            const filterArray = filterString?.split(';') ?? [];

            // Look up path model for the path based filters, otherwise parse the code filter
            let paths;
            const isPathFilterType = isPathFilter(filterType);
            if (isPathFilterType) {
                try {
                    paths = filterString ? [await fetchPathModel(filterString)] : [];
                } catch (e) {
                    if (e?.exceptionClass === 'org.labkey.api.view.NotFoundException') {
                        const article = isPathFilterType ? 'Path ' : 'Code ';
                        setError(article + ' not found');
                    } else {
                        setError(e?.exception);
                    }
                }
            } else {
                paths = filterArray.filter(code => !!code).map(code => new PathModel({ code }));
            }

            const filterModels = new Map<string, PathModel>(paths?.map(model => [model.code, model]));
            setFilteredConcepts(filterModels);
        },
        [setError, filterType, setFilteredConcepts]
    );

    const filterChangeHandler = useCallback(
        async (model: PathModel) => {
            setError(null);
            const newFilter = new Map<string, PathModel>([...filteredConcepts]);
            if (!newFilter.delete(model.code)) {
                if (!filterType?.isMultiValued()) {
                    newFilter.clear();
                }

                newFilter.set(model.code, model);
            }

            setFilteredConcepts(newFilter);

            let newFilterString;
            if (isPathFilter(filterType)) {
                const filterStrings = [];
                for await (const filterNode of newFilter.values()) {
                    // Get parent nodes for the selected node's path
                    const parents = await fetchParentPaths(filterNode.path);
                    filterStrings.push(getParentsConceptCodePath(parents));
                }
                newFilterString = filterStrings.join(';');
            } else {
                newFilterString = [...newFilter.keys()].join(';');
            }
            onFilterChange(newFilterString);
        },
        [filterValue, filterType, filteredConcepts, setFilteredConcepts, onFilterChange, setError]
    );

    useEffect(
        () => {
            updateFilterValues(filterValue);
        },
        // Trigger effect if the filterType value changes. This will facilitate switching between Concept code based filters and Path based filters
        [filterType, filterValue]
    );

    useEffect(() => {
        if (conceptSubtree) {
            fetchPathModel(conceptSubtree)
                .then(setSubtreePath)
                .catch(() => {
                    // set to null to complete rendering of OntologyBrowserPanel (note: fetchPathModel will console.error)
                    setSubtreePath(null);
                });
        }
    }, [conceptSubtree]);

    if (conceptSubtree && subtreePath === undefined) {
        return <LoadingSpinner />;
    }

    return (
        <>
            <Alert>{error}</Alert>
            <OntologyBrowserPanel
                asPanel={false}
                hideConceptInfo={true}
                initOntologyId={ontologyId}
                initPath={subtreePath}
                filters={filteredConcepts}
                filterChangeHandler={filterChangeHandler}
            />
        </>
    );
});
