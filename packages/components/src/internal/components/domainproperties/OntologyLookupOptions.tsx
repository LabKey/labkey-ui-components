import React, { PureComponent, ReactNode } from 'react';
import { Col, FormControl, Row } from 'react-bootstrap';
import { List } from 'immutable';
import { getServerContext } from '@labkey/api';

import { DomainField, LabelHelpTip } from '../../..';
import { helpLinkNode, ONTOLOGY_TOPIC } from '../../util/helpLinks';

import { isFieldFullyLocked } from './propertiesUtil';
import { createFormInputId, fetchOntologies } from './actions';
import {
    DOMAIN_FIELD_ONTOLOGY_IMPORT_COL,
    DOMAIN_FIELD_ONTOLOGY_LABEL_COL,
    DOMAIN_FIELD_ONTOLOGY_SOURCE,
} from './constants';
import { ITypeDependentProps, OntologyModel } from './models';
import { SectionHeading } from './SectionHeading';

interface Props extends ITypeDependentProps {
    field: DomainField;
    domainFields: List<DomainField>;
}

interface State {
    loading: boolean;
    ontologies: OntologyModel[];
}

export class OntologyLookupOptions extends PureComponent<Props, State> {
    state: Readonly<State> = {
        loading: true,
        ontologies: [],
    };

    componentDidMount(): void {
        this.loadData();
    }

    loadData = async (): Promise<void> => {
        try {
            const newOntologies = await fetchOntologies(getServerContext().container.path);
            this.setState(
                () => ({
                    loading: false,
                    ontologies: newOntologies,
                }),
                () => {
                    const { field } = this.props;
                    const { ontologies } = this.state;

                    // default to selecting the first ontology in the list, if > 0 exist and one is not already selected
                    if (ontologies?.length > 0 && !field.sourceOntology) {
                        this.onChange(this.getSourceInputId(), ontologies[0].abbreviation);
                    }
                }
            );
        } catch (error) {
            console.error('Failed to retrieve available types for Ontology.', error);
            this.setState(() => ({ loading: false }));
        }
    };

    onSelectChange = (id, formValue, selected): void => {
        this.onChange(id, selected?.name);
    };

    onFieldChange = (evt: any): void => {
        this.onChange(evt.target.id, evt.target.value);
    };

    onChange(id: string, value: any): void {
        this.props.onChange?.(id, value);
    }

    getChooseSourceHelpText = (): ReactNode => {
        return (
            <>
                <p>
                    <i>
                        This is currently an experimental feature and is not officially supported. By using this feature
                        By using this feature you acknowledge that these functions may change, possibly affecting your
                        possibly affecting your data.
                    </i>
                </p>
                <p>Choose which ontology to use to lookup concept codes and preferred names.</p>
                <p>Learn more about {helpLinkNode(ONTOLOGY_TOPIC, 'ontology integration')} in LabKey.</p>
            </>
        );
    };

    getImportFieldHelpText = (): ReactNode => {
        return (
            <>
                <p>Choose which text field to use when looking up a code against the selected ontology.</p>
                <p>Learn more about {helpLinkNode(ONTOLOGY_TOPIC, 'ontology integration')} in LabKey.</p>
            </>
        );
    };

    getLabelFieldHelpText = (): ReactNode => {
        return (
            <>
                <p>Choose which text field to store the preferred name of the concept.</p>
                <p>Learn more about {helpLinkNode(ONTOLOGY_TOPIC, 'ontology integration')} in LabKey.</p>
            </>
        );
    };

    getSourceInputId(): string {
        const { index, domainIndex } = this.props;
        return createFormInputId(DOMAIN_FIELD_ONTOLOGY_SOURCE, domainIndex, index);
    }

    renderTextDomainFieldSelect(id: string, value: string, filterValue: string): ReactNode {
        const { domainFields, lockType, field } = this.props;

        return (
            <FormControl
                componentClass="select"
                id={id}
                key={id}
                disabled={isFieldFullyLocked(lockType)}
                onChange={this.onFieldChange}
                value={value}
            >
                <option value={null} />
                {domainFields.map((df, index) => {
                    // Need to preserve index so don't filter, but return null for those fields we don't want as options
                    // (i.e. don't show self, fields with no name, fields not of type string, or field selected as the other lookup option)
                    if (df === field || df.hasInvalidName() || !df.dataType.isString() || df.name === filterValue) {
                        return null;
                    }

                    return (
                        <option key={index} value={df.name}>
                            {df.name}
                        </option>
                    );
                })}
            </FormControl>
        );
    }

    render(): ReactNode {
        const { index, label, lockType, domainIndex, field } = this.props;
        const { loading, ontologies } = this.state;
        const sourceId = this.getSourceInputId();
        const labelColId = createFormInputId(DOMAIN_FIELD_ONTOLOGY_LABEL_COL, domainIndex, index);
        const importColId = createFormInputId(DOMAIN_FIELD_ONTOLOGY_IMPORT_COL, domainIndex, index);

        return (
            <div>
                <Row className="domain-row-expanded">
                    <Col xs={12}>
                        <SectionHeading title={label} />
                    </Col>
                </Row>
                <Row className="domain-row-expanded">
                    <Col xs={3}>
                        <div className="domain-field-label">
                            Choose an Ontology
                            <LabelHelpTip title="Experimental Feature" body={this.getChooseSourceHelpText} />
                        </div>
                    </Col>
                    <Col xs={3}>
                        <div className="domain-field-label">
                            Choose an Import Field
                            <LabelHelpTip title="Experimental Feature" body={this.getImportFieldHelpText} />
                        </div>
                    </Col>
                    <Col xs={3}>
                        <div className="domain-field-label">
                            Choose a Label Field
                            <LabelHelpTip title="Experimental Feature" body={this.getLabelFieldHelpText} />
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col xs={3}>
                        <FormControl
                            componentClass="select"
                            id={sourceId}
                            key={sourceId}
                            disabled={isFieldFullyLocked(lockType)}
                            onChange={this.onFieldChange}
                            value={field.sourceOntology}
                        >
                            {loading && (
                                <option disabled key="_loading">
                                    Loading...
                                </option>
                            )}
                            {!loading && ontologies.length === 0 && (
                                <option key="_currentValue" value={field.sourceOntology}>
                                    {field.sourceOntology}
                                </option>
                            )}
                            {!loading &&
                                ontologies.length > 0 &&
                                ontologies.map(ontology => {
                                    return (
                                        <option key={ontology.abbreviation} value={ontology.abbreviation}>
                                            {ontology.getLabel()}
                                        </option>
                                    );
                                })}
                        </FormControl>
                    </Col>
                    <Col xs={3}>
                        {this.renderTextDomainFieldSelect(
                            importColId,
                            field.conceptImportColumn,
                            field.conceptLabelColumn
                        )}
                    </Col>
                    <Col xs={3}>
                        {this.renderTextDomainFieldSelect(
                            labelColId,
                            field.conceptLabelColumn,
                            field.conceptImportColumn
                        )}
                    </Col>
                </Row>
            </div>
        );
    }
}
