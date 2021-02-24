import React, { FC, memo, useEffect, useState } from 'react';

import { LoadingSpinner, Alert, SelectInput } from '../../..';

import { fetchChildPaths } from './actions';
import { PathModel } from './models';

interface OntologySelectionPanelProps {
    onOntologySelection: (name: string, value: string, model: PathModel) => void;
    asPanel: boolean;
}

export const OntologySelectionPanel: FC<OntologySelectionPanelProps> = memo(props => {
    const { onOntologySelection, asPanel } = props;
    const [error, setError] = useState<string>();
    const [ontologies, setOntologies] = useState<PathModel[]>();

    useEffect(() => {
        fetchChildPaths('/')
            .then(ontologies => {
                setOntologies(ontologies.children);
            })
            .catch(reason => {
                setError('Error: unable to load ontology information for selection.');
                setOntologies([]);
            });
    }, [setOntologies, setError]);

    const body = (
        <>
            <Alert>{error}</Alert>
            {!ontologies && <LoadingSpinner msg="Loading ontologies..." />}
            {ontologies && (
                <SelectInput
                    key="ontology-select"
                    name="ontology-select"
                    id="ontology-select"
                    label="Select Ontology"
                    description="Select an ontology to load and browse concepts."
                    inputClass="col-sm-6 col-xs-12"
                    labelClass="control-label col-sm-3 text-left col-xs-12"
                    formsy={false}
                    multiple={false}
                    valueKey="code"
                    labelKey="label"
                    onChange={onOntologySelection}
                    options={ontologies}
                />
            )}
        </>
    );

    if (!asPanel) {
        return body;
    }

    return (
        <>
            <div className="panel panel-default ontology-browser-container">
                <div className="panel-heading">Browse Ontology Concepts</div>
                <div className="panel-body">{body}</div>
            </div>
        </>
    );
});
