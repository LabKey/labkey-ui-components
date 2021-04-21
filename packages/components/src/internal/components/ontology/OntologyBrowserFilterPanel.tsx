import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Filter } from '@labkey/api';

import { OntologyBrowserPanel, OntologyBrowserProps } from './OntologyBrowserPanel';
import { ONTOLOGY_ROOT_CODE_PREFIX, PathModel } from './models';
import { fetchParentPaths, fetchPathModel } from './actions';
import { Alert } from '../base/Alert';

interface OntologyBrowserFilterPanelProps extends OntologyBrowserProps {
    ontologyId: string;
    filterValue: string;
    filterType: Filter.IFilterType;
    onFilterChange: (filterValue: string) => void;
}

export const OntologyBrowserFilterPanel: FC<OntologyBrowserFilterPanelProps> = memo(props => {
    const { ontologyId, filterType, filterValue, onFilterChange, } = props;
    const [filteredConcepts, setFilteredConcepts] = useState<Map<string, PathModel>>(new Map());
    const [error, setError] = useState<String>();

    const updateFilterValues = useCallback(
        async (filterString: string) => {
            const filterArray = filterString?.split(';') || [];

            // Look up path model for the path based filters, otherwise parse the code filter
            const isPathFilter = filterType.getURLSuffix() === Filter.Types.ONTOLOGY_IN_SUBTREE.getURLSuffix() || filterType.getURLSuffix() === Filter.Types.ONTOLOGY_NOT_IN_SUBTREE.getURLSuffix();
            let paths;
            if (isPathFilter) {
                try {
                    paths = filterString ? [await fetchPathModel(filterString)] : [];
                } catch (e) {
                    setError('' + e.exception);
                }
            } else {
                paths = filterArray.filter(code => !!code).map(code => new PathModel({ code }));
            }

            const filterModels = new Map<string, PathModel>(paths?.map(model => [model.code, model]));
            setFilteredConcepts(filterModels);
        },
        [error, setError, filterType, setFilteredConcepts]
    );

    const filterChangeHandler = useCallback(
        async (model: PathModel) => {
            const newFilter = new Map([...filteredConcepts]);
            if (!newFilter.delete(model.code)) {
                if (!filterType?.isMultiValued()) {
                    newFilter.clear();
                }

                newFilter.set(model.code, model);
            }

            setFilteredConcepts(newFilter);

            console.log(filterType.getDisplayText());
            const isPathFilter = filterType.getURLSuffix() === Filter.Types.ONTOLOGY_IN_SUBTREE.getURLSuffix() || filterType.getURLSuffix() === Filter.Types.ONTOLOGY_NOT_IN_SUBTREE.getURLSuffix();
            let newFilterString;
            if (isPathFilter) {
                const filterStrings = [];
                for await (const filterNode of newFilter.values()) {
                    const parents = await fetchParentPaths(filterNode.path);
                    filterStrings.push(
                        [...parents]
                            .filter(node => !node.code.startsWith(ONTOLOGY_ROOT_CODE_PREFIX)) // Ignore the root node
                            .map(node => node.code)
                            .join('/')
                    );
                }
                newFilterString = filterStrings.join(';');
            } else {
                newFilterString = [...newFilter.keys()].join(';');
            }
            onFilterChange?.(newFilterString);
        },
        [filterType, filteredConcepts, setFilteredConcepts, onFilterChange]
    );

    useEffect(() => {
        updateFilterValues(filterValue);
    }, [filterType, filterValue]);

    return (
        <>
            {error && <Alert>{error}</Alert>}
            <OntologyBrowserPanel
                asPanel={false}
                hideConceptInfo={true}
                initOntologyId={ontologyId}
                filters={filteredConcepts}
                filterChangeHandler={filterChangeHandler}
            />
        </>
    );
});
