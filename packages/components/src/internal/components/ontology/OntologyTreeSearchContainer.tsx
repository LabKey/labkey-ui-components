import React, { ChangeEvent, FC, memo, MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { Alert, searchUsingIndex } from '../../..';

import { ConceptModel, OntologyModel, PathModel } from './models';
import { fetchAlternatePaths } from './actions';

const CONCEPT_CATEGORY = 'concept';
const SEARCH_LIMIT = 20;

interface OntologyTreeSearchContainerProps {
    ontology: OntologyModel;
    searchPathClickHandler: (path: PathModel, isAlternatePath?: boolean) => void;
}

export const OntologyTreeSearchContainer: FC<OntologyTreeSearchContainerProps> = memo(props => {
    const { ontology, searchPathClickHandler } = props;
    const [isFocused, setIsFocused] = useState<boolean>();
    const [searchTerm, setSearchTerm] = useState<string>();
    const [searchHits, setSearchHits] = useState<ConceptModel[]>();
    const [totalHits, setTotalHits] = useState<number>();
    const [error, setError] = useState<string>();

    const onSearchChange = useCallback(
        (evt: ChangeEvent<HTMLInputElement>) => {
            const { value } = evt.currentTarget;
            setSearchTerm(value?.length > 2 ? value : undefined);
        },
        [setSearchTerm]
    );

    const onSearchFocus = useCallback(() => {
        setIsFocused(true);
    }, [setIsFocused]);
    const onSearchBlur = useCallback(() => {
        setIsFocused(false);
    }, [onSearchFocus]);

    useEffect(() => {
        setError(undefined);
        setTotalHits(undefined);
        setSearchHits(undefined);

        if (searchTerm) {
            const timeOutId = setTimeout(() => {
                searchUsingIndex({ q: searchTerm, category: CONCEPT_CATEGORY, limit: SEARCH_LIMIT }, undefined, [
                    CONCEPT_CATEGORY,
                ])
                    .then(response => {
                        setSearchHits(
                            response.hits.map(hit => {
                                return new ConceptModel({
                                    code: hit.identifiers,
                                    label: hit.title,
                                    description: hit.summary.split('\n')[1], // format is "<code> <label>\n<description>" see ConceptDocumentProvider
                                });
                            })
                        );
                        setTotalHits(response.totalHits);
                    })
                    .catch(reason => {
                        console.error(reason);
                        setError('Error: unable to get search results. Check for syntax errors in your search term.');
                    });
            }, 500);

            return () => clearTimeout(timeOutId);
        }
    }, [searchTerm, setError, setSearchHits, setTotalHits]);

    const onItemClick = useCallback(
        async (evt: MouseEvent<HTMLLIElement>, code: string) => {
            // for now we will just send the user to the first path for this concept, in the future we'll add in UI
            // that lets the user select if more then one path exists for the concept
            const codePaths = await fetchAlternatePaths(code);
            if (codePaths?.length > 0) {
                searchPathClickHandler(codePaths[0], true);
            }
        },
        [searchPathClickHandler]
    );

    // cancel form submit since we are just using the input for the search menu display
    const onSubmit = useCallback((evt) => {
        evt.preventDefault();
        return false;
    }, []);

    return (
        <div className="concept-search-container">
            <form autoComplete="off" onSubmit={onSubmit}>
                <input
                    type="text"
                    className="form-control"
                    name="concept-search"
                    placeholder={'Search ' + ontology.abbreviation}
                    onChange={onSearchChange}
                    onFocus={onSearchFocus}
                    onBlur={onSearchBlur}
                />
            </form>
            <OntologySearchResultsMenu
                searchHits={searchHits}
                totalHits={totalHits}
                isFocused={isFocused}
                error={error}
                onItemClick={onItemClick}
            />
        </div>
    );
});

interface OntologySearchResultsMenuProps {
    searchHits: ConceptModel[];
    totalHits: number;
    isFocused: boolean;
    error: string;
    onItemClick: (evt: MouseEvent<HTMLLIElement>, code: string) => void;
}

// exported for jest testing
export const OntologySearchResultsMenu: FC<OntologySearchResultsMenuProps> = memo(props => {
    const { searchHits, isFocused, totalHits, error, onItemClick } = props;
    const showMenu = useMemo(() => isFocused && (searchHits !== undefined || error !== undefined), [
        isFocused,
        searchHits,
        error,
    ]);
    const hitsHaveDescriptions = useMemo(() => searchHits?.findIndex(hit => hit.description !== undefined) > -1, [
        searchHits,
    ]);

    if (!showMenu) {
        return null;
    }

    return (
        <div>
            <ul className="result-menu container">
                <Alert>{error}</Alert>
                {searchHits?.length === 0 && (
                    <li key="none">
                        <div className="row">
                            <div className="col col-xs-12">No search results found.</div>
                        </div>
                    </li>
                )}
                {searchHits?.map(hit => (
                    <li
                        key={hit.code}
                        className="selectable-item"
                        role="option"
                        onMouseDown={evt => onItemClick(evt, hit.code)}
                    >
                        <div className="row">
                            <div className={'col bold ' + (hitsHaveDescriptions ? 'col-xs-5' : 'col-xs-10')}>
                                {hit.label}
                            </div>
                            <div className="col col-xs-2">{hit.code}</div>
                            {hitsHaveDescriptions && <div className="col col-xs-5">{hit.description}</div>}
                        </div>
                    </li>
                ))}
                {searchHits?.length < totalHits && (
                    <div className="result-footer">
                        {Number(totalHits).toLocaleString()} results found. Update your search term to further refine
                        your results.
                    </div>
                )}
            </ul>
        </div>
    );
});
