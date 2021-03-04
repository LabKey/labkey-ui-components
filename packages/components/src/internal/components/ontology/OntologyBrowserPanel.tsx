import React, { ChangeEvent, FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Row } from 'react-bootstrap';

import { Alert, LabelHelpTip, LoadingSpinner, searchUsingIndex } from '../../..';

import { fetchConceptForCode, getOntologyDetails } from './actions';
import { ConceptModel, OntologyModel, PathModel } from './models';
import { ConceptInformationTabs } from './ConceptInformationTabs';
import { OntologyTreePanel } from './OntologyTreePanel';
import { OntologySelectionPanel } from './OntologySelectionPanel';

const CONCEPT_CATEGORY = 'concept';
const SEARCH_LIMIT = 10;

export interface OntologyBrowserProps {
    initOntologyId?: string;
    asPanel?: boolean;
    onConceptSelect?: (concept: ConceptModel) => void;
}

export const OntologyBrowserPanel: FC<OntologyBrowserProps> = memo(props => {
    const { initOntologyId, asPanel, onConceptSelect } = props;
    const [error, setError] = useState<string>();
    const [selectedOntologyId, setSelectedOntologyId] = useState<string>();
    const [ontology, setOntologyModel] = useState<OntologyModel>();
    const [selectedConceptCode, setSelectedCode] = useState<string>();
    const [selectedConcept, setSelectedConcept] = useState<ConceptModel>();
    const [conceptCache, setConceptCache] = useState<Map<string, ConceptModel>>(new Map<string, ConceptModel>());
    const ontologyId = selectedOntologyId ?? (!error ? initOntologyId : undefined);

    const cacheConcepts = useCallback(
        (concepts: ConceptModel[]): void => {
            concepts.forEach((concept): void => {
                if (!conceptCache.has(concept.code)) {
                    conceptCache.set(concept.code, concept);
                }
            });
            setConceptCache(new Map(conceptCache));
        },
        [conceptCache, setConceptCache]
    );

    const updateSelectedConceptCode = useCallback(
        async (selectedCode: string): Promise<void> => {
            if (!conceptCache.has(selectedCode)) {
                const concept = await fetchConceptForCode(selectedCode);
                cacheConcepts([concept]);
            }
            setSelectedCode(selectedCode);
        },
        [setSelectedCode, conceptCache]
    );

    const onOntologySelection = useCallback(
        (name: string, value: string, model: PathModel) => {
            setSelectedOntologyId(model?.path.replace(/\//g, ''));
        },
        [setSelectedOntologyId]
    );

    useEffect(() => {
        if (ontologyId) {
            getOntologyDetails(ontologyId)
                .then(setOntologyModel)
                .catch(() => {
                    setError('Error: unable to load ontology concept information for ' + ontologyId + '.');
                    setSelectedOntologyId(undefined);
                });
        } else {
            setOntologyModel(undefined);
        }
    }, [setOntologyModel, selectedOntologyId, setSelectedOntologyId, setError]);

    useEffect(() => {
        const concept = conceptCache.get(selectedConceptCode);
        setSelectedConcept(concept);
        onConceptSelect?.(concept);
    }, [selectedConceptCode, conceptCache, setSelectedConcept, onConceptSelect]);

    return (
        <>
            <Alert>{error}</Alert>
            {!ontologyId && <OntologySelectionPanel onOntologySelection={onOntologySelection} asPanel={asPanel} />}
            {ontologyId && (
                <OntologyBrowserPanelImpl
                    ontology={ontology}
                    selectedConcept={selectedConcept}
                    setSelectedConcept={updateSelectedConceptCode}
                    asPanel={asPanel}
                />
            )}
        </>
    );
});

OntologyBrowserPanel.defaultProps = {
    asPanel: true,
};

interface OntologyBrowserPanelImplProps {
    ontology: OntologyModel;
    selectedConcept?: ConceptModel;
    setSelectedConcept: (conceptCode: string) => void;
    asPanel: boolean;
}

// exported for jest testing
export const OntologyBrowserPanelImpl: FC<OntologyBrowserPanelImplProps> = memo(props => {
    const { ontology, selectedConcept, setSelectedConcept, asPanel } = props;

    if (!ontology) {
        return <LoadingSpinner />;
    }

    const { conceptCount, description } = ontology;
    const root = ontology.getPathModel();

    const body = (
        <Row>
            <Col xs={6} className="left-panel">
                <OntologyTreeSearchContainer ontology={ontology} />
                <OntologyTreePanel
                    root={root}
                    onNodeSelection={setSelectedConcept}
                />
            </Col>
            <Col xs={6} className="right-panel">
                <ConceptInformationTabs concept={selectedConcept} />
            </Col>
        </Row>
    );

    if (!asPanel) {
        return <div className="ontology-browser-container">{body}</div>;
    }

    return (
        <div className="panel panel-default ontology-browser-container">
            <div className="panel-heading">
                Browse {ontology.getDisplayName()}
                &nbsp;
                <LabelHelpTip
                    title="Ontology Details"
                    placement="bottom"
                    iconComponent={<i className="fa fa-info-circle" />}
                >
                    {description && <p className="ontology-description">{description}</p>}
                    <p className="ontology-concept-count">{Number(conceptCount).toLocaleString()} total concepts</p>
                </LabelHelpTip>
            </div>
            <div className="panel-body">{body}</div>
        </div>
    );
});

// TODO move this to separate file
interface OntologyTreeSearchContainerProps {
    ontology: OntologyModel,
}

export const OntologyTreeSearchContainer: FC<OntologyTreeSearchContainerProps> = memo(props => {
    const { ontology } = props;
    const [isFocused, setIsFocused] = useState<boolean>();
    const [searchTerm, setSearchTerm] = useState<string>();
    const [searchHits, setSearchHits] = useState<ConceptModel[]>();
    const [totalHits, setTotalHits] = useState<number>();
    const [error, setError] = useState<string>();
    const showMenu = useMemo(() => isFocused && (searchHits !== undefined || error !== undefined), [isFocused, searchHits, error]);

    const onSearchChange = useCallback(
        (evt: ChangeEvent<HTMLInputElement>) => {
            const { value } = evt.currentTarget;
            setSearchTerm(value?.length > 2 ? value : undefined);
        },
        [setSearchTerm]
    );

    const onSearchFocus = useCallback(() => { setIsFocused(true); }, [setIsFocused]);
    const onSearchBlur = useCallback(() => { setIsFocused(false); }, [onSearchFocus]);

    useEffect(() => {
        setError(undefined);
        setTotalHits(undefined);
        if (!searchTerm) {
            setSearchHits(undefined);
        } else {
            const timeOutId = setTimeout(() => {
                searchUsingIndex({ q: searchTerm, category: CONCEPT_CATEGORY, limit: SEARCH_LIMIT }, undefined, [CONCEPT_CATEGORY])
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
                        setError('Error: unable to get search results. ' + reason?.exception);
                        setSearchHits(undefined);
                    });
            }, 500);

            return () => clearTimeout(timeOutId);
        }
    }, [searchTerm, setError, setSearchHits, setTotalHits]);

    return (
        <div className="concept-search-container">
            <form autoComplete="off">
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
            {showMenu && (
                <div>
                    <ul className="result-menu">
                        <Alert>{error}</Alert>
                        {searchHits === undefined && <li key="none">No search results found.</li>}
                        {searchHits?.map(hit => (
                            <li key={hit.code}>{hit.label}</li>
                        ))}
                        {searchHits?.length < totalHits && (
                            <div>
                                More then {SEARCH_LIMIT} results found. Update your search term to further refine your
                                results.
                            </div>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
});
