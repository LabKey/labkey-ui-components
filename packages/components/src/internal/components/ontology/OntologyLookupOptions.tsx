import React, { PureComponent, ReactNode, FC, memo } from 'react';
import { FormControl } from 'react-bootstrap';
import { List } from 'immutable';

import { ADVANCED_FIELD_EDITOR_TOPIC, HelpLink, ONTOLOGY_LOOKUP_TOPIC } from '../../util/helpLinks';

import { isFieldFullyLocked } from '../domainproperties/propertiesUtil';
import { getIndexFromId, createFormInputId } from '../domainproperties/utils';
import {
    DOMAIN_FIELD_ONTOLOGY_IMPORT_COL,
    DOMAIN_FIELD_ONTOLOGY_LABEL_COL,
    DOMAIN_FIELD_ONTOLOGY_SOURCE,
    DOMAIN_FIELD_ONTOLOGY_SUBTREE_COL,
    DOMAIN_FIELD_SHOWNININSERTVIEW,
    DOMAIN_FIELD_SHOWNINUPDATESVIEW,
} from '../domainproperties/constants';
import { DomainField, IFieldChange, ITypeDependentProps } from '../domainproperties/models';
import { SectionHeading } from '../domainproperties/SectionHeading';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { sampleManagerIsPrimaryApp } from '../../app/utils';

import { DomainPropertiesAPIWrapper } from '../domainproperties/APIWrapper';

import { getDefaultAPIWrapper } from '../../APIWrapper';

import { OntologyModel, PathModel } from './models';
import { OntologyConceptSelectButton } from './OntologyConceptSelectButton';
import { fetchParentPaths, getParentsConceptCodePath } from './actions';

const LEARN_MORE = (
    <p>
        Learn more about{' '}
        <HelpLink topic={sampleManagerIsPrimaryApp() ? ADVANCED_FIELD_EDITOR_TOPIC : ONTOLOGY_LOOKUP_TOPIC}>
            ontology integration
        </HelpLink>{' '}
        in LabKey.
    </p>
);

interface Props extends ITypeDependentProps {
    api?: DomainPropertiesAPIWrapper;
    domainContainerPath: string;
    domainFields: List<DomainField>;
    field: DomainField;
    onMultiChange: (changes: List<IFieldChange>) => void;
}

interface State {
    loading: boolean;
    ontologies: OntologyModel[];
}

export class OntologyLookupOptions extends PureComponent<Props, State> {
    static defaultProps = {
        api: getDefaultAPIWrapper().domain,
    };

    state: Readonly<State> = {
        loading: true,
        ontologies: [],
    };

    componentDidMount = async (): Promise<void> => {
        const { domainContainerPath, api } = this.props;

        try {
            const newOntologies = await api.fetchOntologies(domainContainerPath);
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

    onOntologyFieldChange = (evt: any): void => {
        const { domainIndex, onMultiChange } = this.props;
        const { id, value } = evt.target;
        let changes = List<IFieldChange>([{ id, value }]);
        changes = changes.push({
            id: createFormInputId(DOMAIN_FIELD_ONTOLOGY_SUBTREE_COL, domainIndex, getIndexFromId(id)),
            value: undefined,
        });
        onMultiChange(changes);
    };

    onOntologySubtreeChange = async (id: string, path: PathModel): Promise<void> => {
        let subtreePath;
        if (path?.path) {
            const parents = await fetchParentPaths(path.path);
            subtreePath = getParentsConceptCodePath(parents);
        }
        this.onChange(id, subtreePath);
    };

    onFieldChange = (evt: any): void => {
        const val = evt.target.value;
        let changes = List<IFieldChange>([{ id: evt.target.id, value: val }]);

        const valFieldIdx = this.props.domainFields.findIndex(df => df.name === val);
        if (valFieldIdx > 0) {
            const valFieldInsertId = createFormInputId(
                DOMAIN_FIELD_SHOWNININSERTVIEW,
                this.props.domainIndex,
                valFieldIdx
            );
            const valFieldUpdateId = createFormInputId(
                DOMAIN_FIELD_SHOWNINUPDATESVIEW,
                this.props.domainIndex,
                valFieldIdx
            );
            changes = changes.push({ id: valFieldInsertId, value: false }, { id: valFieldUpdateId, value: false });
        }

        this.props.onMultiChange(changes);
    };

    onChange(id: string, value: any): void {
        this.props.onChange?.(id, value);
    }

    getSourceInputId(): string {
        const { index, domainIndex } = this.props;
        return createFormInputId(DOMAIN_FIELD_ONTOLOGY_SOURCE, domainIndex, index);
    }

    render(): ReactNode {
        const { index, label, lockType, domainIndex, field, domainFields } = this.props;
        const { loading, ontologies } = this.state;
        const sourceId = this.getSourceInputId();

        return (
            <div>
                <div className="row">
                    <div className="col-xs-12">
                        <SectionHeading title={label} />
                    </div>
                </div>
                <div className="row">
                    <div className="col-xs-5">
                        <div className="domain-field-label">
                            Choose an Ontology
                            <LabelHelpTip title="Choose an Ontology">
                                <>
                                    <p>Choose which ontology to use to lookup concept codes and preferred names.</p>
                                    <p>
                                        Optionally, you may use the "Expected Vocabulary" option to select a concept
                                        hierarchy which will be used to guide users to a concept hierarchy subtree of
                                        interest during data entry for this field.
                                    </p>
                                    {LEARN_MORE}
                                </>
                            </LabelHelpTip>
                        </div>
                    </div>
                    <div className="col-xs-3">
                        <div className="domain-field-label">
                            Choose an Import Field
                            <LabelHelpTip title="Choose an Import Field">
                                <p>
                                    Choose which text field to use when looking up a code against the selected ontology.
                                </p>
                                {LEARN_MORE}
                            </LabelHelpTip>
                        </div>
                    </div>
                    <div className="col-xs-3">
                        <div className="domain-field-label">
                            Choose a Label Field
                            <LabelHelpTip title="Choose a Label Field">
                                <p>Choose which text field to store the preferred name of the concept.</p>
                                {LEARN_MORE}
                            </LabelHelpTip>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-xs-5">
                        <FormControl
                            componentClass="select"
                            id={sourceId}
                            key={sourceId}
                            disabled={isFieldFullyLocked(lockType)}
                            onChange={this.onOntologyFieldChange}
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
                                            {ontology.getDisplayName()}
                                        </option>
                                    );
                                })}
                        </FormControl>
                        <div className="domain-field-label">
                            <OntologyConceptSelectButton
                                id={createFormInputId(DOMAIN_FIELD_ONTOLOGY_SUBTREE_COL, domainIndex, index)}
                                title="Expected Vocabulary"
                                field={field}
                                valueProp="conceptSubtree"
                                valueIsPath={true}
                                onChange={this.onOntologySubtreeChange}
                                useFieldSourceOntology
                            />
                        </div>
                    </div>
                    <div className="col-xs-3">
                        <OntologyTextDomainFieldSelect
                            field={field}
                            domainFields={domainFields}
                            lockType={lockType}
                            id={createFormInputId(DOMAIN_FIELD_ONTOLOGY_IMPORT_COL, domainIndex, index)}
                            value={field.conceptImportColumn}
                            filterValue={field.conceptLabelColumn}
                            onFieldChange={this.onFieldChange}
                        />
                    </div>
                    <div className="col-xs-3">
                        <OntologyTextDomainFieldSelect
                            field={field}
                            domainFields={domainFields}
                            lockType={lockType}
                            id={createFormInputId(DOMAIN_FIELD_ONTOLOGY_LABEL_COL, domainIndex, index)}
                            value={field.conceptLabelColumn}
                            filterValue={field.conceptImportColumn}
                            onFieldChange={this.onFieldChange}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

interface OntologyTextDomainFieldSelectProps {
    domainFields: List<DomainField>;
    field: DomainField;
    filterValue: string;
    id: string;
    lockType: string;
    onFieldChange: (evt: any) => void;
    value: string;
}

const OntologyTextDomainFieldSelect: FC<OntologyTextDomainFieldSelectProps> = memo(props => {
    const { domainFields, lockType, field, id, value, filterValue, onFieldChange } = props;

    return (
        <FormControl
            componentClass="select"
            id={id}
            key={id}
            disabled={isFieldFullyLocked(lockType)}
            onChange={onFieldChange}
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
});
