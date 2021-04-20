import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Filter } from '@labkey/api';

import { OntologyBrowserPanel, OntologyBrowserProps } from './OntologyBrowserPanel';
import { PathModel } from './models';
import { fetchPathModel } from './actions';

interface OntologyBrowserFilterPanelProps extends OntologyBrowserProps {
    ontologyId: string;
    filterValue: string;
    filterType: Filter.IFilterType;
    onFilterChange: (filterValue: string) => void;
}

export const OntologyBrowserFilterPanel: FC<OntologyBrowserFilterPanelProps> = memo(props => {
    const { ontologyId, filterType, filterValue, onFilterChange, } = props;
    const [filteredConcepts, setFilteredConcepts] = useState<Map<string, PathModel>>(new Map());

    const updateFilterValues = useCallback(
        async (filterString: string) => {
            const filterArray = filterString?.split(';') || [];

            // Look up path model for the path based filters, otherwise parse the code filter
            const isPathFilter = filterType.getURLSuffix() === Filter.Types.ONTOLOGY_IN_SUBTREE.getURLSuffix() || filterType.getURLSuffix() === Filter.Types.ONTOLOGY_NOT_IN_SUBTREE.getURLSuffix();
            let paths;
            if (isPathFilter) {
                paths = [await fetchPathModel(filterString)];
            } else {
                paths = filterArray.filter(code => !!code).map(code => new PathModel({ code }));
            }

            const filterModels = new Map<string, PathModel>(paths.map(model => [model.code, model]));
            setFilteredConcepts(filterModels);
        },
        [filterType, setFilteredConcepts]
    );

    const filterChangeHandler = useCallback(
        (model: PathModel) => {
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
                newFilterString = [...newFilter.values()].map(path => path.path).join(';');
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
