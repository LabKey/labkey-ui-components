import React from 'react';
import { Col, Panel, Row } from 'react-bootstrap';
import { Map } from 'immutable';

import { initSampleSetSelects } from './actions';
import {
    IParentAlias,
    IParentOption,
    ISampleSetDetails,
    NEW_SAMPLE_TYPE_DOMAIN_KIND
} from './models';
import { LabelOverlay } from '../../components/forms/LabelOverlay';
import { SampleSetParentAliasRow } from '../../components/samples/SampleSetParentAliasRow';
import { PARENT_ALIAS_HELPER_TEXT, SAMPLE_SET_DISPLAY_TEXT } from '../../constants';
import { AddEntityButton } from '../buttons/AddEntityButton';
import { WizardNavButtons } from '../buttons/WizardNavButtons';
import { generateId } from '../../util/utils';
import { Alert } from '../base/Alert';
import { getActionErrorMessage, resolveErrorMessage } from "../../util/messaging";
import { DERIVE_SAMPLES_ALIAS_TOPIC, helpLinkNode } from '../../util/helpLinks';
import { EntityDetailsForm } from "../domainproperties/entities/EntityDetailsForm";
import {
    getEntityDescriptionValue,
    getEntityNameExpressionValue,
    getEntityNameValue,
    isEntityFormValid,
    isExistingEntity
} from "../domainproperties/entities/actions";
import DomainForm from "../domainproperties/DomainForm";
import {
    DomainDesign,
    DomainDetails,
    DomainField,
    IDomainField,
    SAMPLE_TYPE,
} from "../domainproperties/models"
import {SampleTypeModel} from "../domainproperties/samples/models"
import {saveDomain} from "../..";
import {KINDS} from "../domainproperties/constants";
import {addDomainField, getDomainPanelClass} from "../domainproperties/actions";
import {CollapsiblePanelHeader} from "../domainproperties/CollapsiblePanelHeader";
import {
    DomainPropertiesPanelContext,
    IDomainPropertiesPanelContext
} from "../domainproperties/DomainPropertiesPanelContext";

const CREATE_ERROR = getActionErrorMessage(`There was a problem creating the ${SAMPLE_SET_DISPLAY_TEXT.toLowerCase()}.`, SAMPLE_SET_DISPLAY_TEXT.toLowerCase());
const UPDATE_ERROR = getActionErrorMessage(`There was a problem updating the ${SAMPLE_SET_DISPLAY_TEXT.toLowerCase()}.`, SAMPLE_SET_DISPLAY_TEXT.toLowerCase());
const DEFAULT_SAMPLE_FIELD_CONFIG = {
    required: true,
    dataType: SAMPLE_TYPE,
    conceptURI: SAMPLE_TYPE.conceptURI,
    rangeURI: SAMPLE_TYPE.rangeURI,
    lookupSchema: 'exp',
    lookupQuery: 'Materials',
    lookupType: {...SAMPLE_TYPE},
    name: 'SampleId',
} as Partial<IDomainField>;

interface Props {
    onCancel: () => void
    onComplete: (response: any) => void
    beforeFinish?: (formValues: {}) => void
    nameExpressionInfoUrl?: string
    // model: SampleTypeModel
    data?: DomainDetails
    nameExpressionPlaceholder?: string
    defaultSampleFieldConfig?: Partial<IDomainField>
}

interface State {
    formValues: ISampleSetDetails
    parentOptions: Array<IParentOption>
    parentAliases: Map<string, IParentAlias>
    error: React.ReactNode
    submitting: boolean
    domain: DomainDesign
    hasError: boolean,
    invalidDomainField: string
}

const NEW_SAMPLE_SET_OPTION: IParentOption = {
    label: `(Current ${SAMPLE_SET_DISPLAY_TEXT})`,
    value: "{{this_sample_set}}"
} as IParentOption;


const IMPORT_PREFIX :string = 'materialInputs/';
const IMPORT_ALIAS_KEY: string = 'importAliases';
const PROPERTIES_HEADER_ID = 'sampletype-properties-hdr';


export class SampleSetDetailsPanel extends React.Component<Props, State> {

    private _dirty: boolean;

    static defaultProps = {
        nameExpressionPlaceholder: 'S-\${now:date}-\${dailySampleCount}',
        defaultSampleFieldConfig: DEFAULT_SAMPLE_FIELD_CONFIG,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            formValues: undefined,
            parentOptions: undefined,
            parentAliases: undefined,
            error: undefined,
            submitting: false,

            domain: undefined,
            hasError: false,
            invalidDomainField: undefined
        }
    }

    initDetails = (data: Map<string, any>): void => {
        const { parentOptions, formValues } = this.state;
        const isUpdate = isExistingEntity(formValues, data);
        const name = getEntityNameValue(formValues, data);

        if (!parentOptions) {
            initSampleSetSelects(isUpdate, name, NEW_SAMPLE_SET_OPTION, IMPORT_PREFIX).then((results) => {
                const options = results.toArray();

                let parentAliases = Map<string, IParentAlias>();
                if (data && data.get(IMPORT_ALIAS_KEY))
                {
                    let importAliases = Map<string,string>(data.get(IMPORT_ALIAS_KEY));
                    importAliases.forEach((val, key) => {
                        const newId = SampleSetDetailsPanel.generateAliasId();
                        parentAliases = parentAliases.set(newId, {
                            id: newId,
                            alias: key,
                            parentValue: options.find(opt => opt.value === val),
                            ignoreAliasError: false,
                            ignoreSelectError: false,
                        } as IParentAlias);
                    });
                }

                this.setState((state) => ({
                    formValues: {
                        ...state.formValues
                    } as ISampleSetDetails,
                    parentOptions: options,
                    parentAliases
                }));
            }).catch((reason) => {
                console.error(reason);
                this.setState(() => ({
                    parentOptions: [NEW_SAMPLE_SET_OPTION]
                }))
            });
        }
    };

    componentDidMount = (): void => {
        const {data = NEW_SAMPLE_TYPE_DOMAIN_KIND} = this.props;
        const {options = Map<string,any>(), domainDesign = DomainDesign.create(null)} = data;

        this.initDetails(options);
        this.initDomain(domainDesign);
    };

    onFormChange = (evt: any): void => {
        const id = evt.target.id;
        const value = evt.target.value;
        this.setState((state) => ({
            formValues: {
                ...state.formValues,
                [id]: value
            } as ISampleSetDetails
        }));
    };

    onFinish = () => {
        const { beforeFinish, data } = this.props;
        const { formValues, domain } = this.state;
        const {options = Map<string,any>()} = data;

        const name = getEntityNameValue(formValues, options);
        const nameExpression = getEntityNameExpressionValue(formValues, options);
        const description = getEntityDescriptionValue(formValues, options);

        this.setSubmitting(true);

        if (beforeFinish) {
            beforeFinish(formValues);
        }

        let domainDesign = domain.merge({
            name: name, //This will be the Sample Type Name
            description: description,
        }) as DomainDesign;

        const details = {
            name: name,
            nameExpression: nameExpression,
            importAliases: this.getImportAliases(),
        };

        if (!isExistingEntity(formValues, options))
        {
            //Initialize a sampleId column, this is not displayed as part of the designer.
            const nameCol = {
                name: 'Name'
            };

            domainDesign = addDomainField(domainDesign, nameCol);
        }

        saveDomain(domainDesign, KINDS.SAMPLE_TYPE, details, name)
            .then((savedDomain) => {
                this.onFinishSuccess(savedDomain);
            })
            .catch((errorDomain) => {
                //TODO need something here.
                console.error(errorDomain);
                this.setState(() => ({
                    domain: errorDomain,
                    submitting: false
                }));
            });

        // if (isExistingEntity(formValues, data)) {
        //     const config = {
        //         isUpdate: true,
        //         rowId: data.get('rowId'),
        //         nameExpression,
        //         description,
        //         importAliasKeys,
        //         importAliasValues,
        //     } as ISampleSetDetails;
        //
        //     updateSampleSet(config)
        //         .then((response) => this.onFinishSuccess(config))
        //         .catch((error) => {
        //             console.error(error);
        //             this.onFinishFailure( resolveErrorMessage(error, "sample type", undefined, "update") || UPDATE_ERROR)
        //         });
        // }
        // else {
        //     const config = {
        //         name,
        //         nameExpression,
        //         description,
        //         importAliasKeys,
        //         importAliasValues,
        //     } as ISampleSetDetails;
        //
        //     createSampleSet(config)
        //         .then((response) => this.onFinishSuccess(config))
        //         .catch((error) => {
        //             console.error(error);
        //             this.onFinishFailure( resolveErrorMessage(error, "sample type") ||  CREATE_ERROR);
        //         });
        // }
    };

    getImportAliases() {
        const { parentAliases } = this.state;

        let importAliases = {};

        if (parentAliases) {
            parentAliases.map((alias: IParentAlias) => {
                importAliases[alias.alias] = alias.parentValue.value;
            });
        }

        return importAliases;
    }


    onFinishSuccess(response: any) {
        this.setSubmitting(false);
        this.props.onComplete(response);
    }

    onFinishFailure(error: React.ReactNode) {
        this.setState(() => ({
            error,
            submitting: false
        }));
    }

    setSubmitting(submitting: boolean) {
        this.setState(() => ({
            error: undefined,
            submitting
        }));
    }

    /**
     * Check if IParentAlias is invalid
     * @param alias
     */
    static parentAliasInvalid(alias: IParentAlias): boolean {
        if (!alias)
            return true;

        //return true if alias is null or blank; or if parentValue option is not set
        return !alias.alias || alias.alias.trim() === '' || !alias.parentValue;
    }

    isFormValid(): boolean {
        //TODO Fix this, it is total horked
        const { formValues, parentAliases } = this.state;
        const { data } = this.props;
        const {options = Map<string, any>()} = data;

        //Check if there are any parent aliases, and if any are invalid (either field blank)
        const hasInvalidAliases =
            parentAliases
            && parentAliases.size > 0
            && parentAliases.find(SampleSetDetailsPanel.parentAliasInvalid);

        return isEntityFormValid(formValues, options) && !hasInvalidAliases;
    }

    // getDataValue(key: string, propName: string, defaultValue: any): any {
    //     const { data } = this.props;
    //     const { formValues } = this.state;
    //
    //     if (key && formValues && formValues[key] !== undefined) {
    //         return formValues[key] || defaultValue;
    //     }
    //     else if (data && data.options) {
    //         return data.options.get(propName) || defaultValue;
    //     }
    //
    //     return defaultValue;
    // }
    //
    // isExistingSampleSet(): boolean {
    //     return this.getDataValue(null, 'rowId', undefined) !== undefined;
    // }
    //
    // getSampleSetName(): string {
    //     return this.getDataValue(FORM_IDS.NAME, 'name', '');
    // }
    //
    // getNameExpressionValue(): string {
    //     return this.getDataValue(FORM_IDS.NAME_EXPRESSION, 'nameExpression', '');
    // }
    //
    // getDescriptionValue(): string {
    //     return this.getDataValue(FORM_IDS.DESCRIPTION, 'description', '');
    // }

    addParentAlias = (): void => {
        let {parentAliases} = this.state;
        parentAliases = parentAliases || Map<string, IParentAlias>();

        const newId = SampleSetDetailsPanel.generateAliasId();
        parentAliases = parentAliases.set(newId, {
            id: newId,
            alias:'',
            parentValue: undefined,
            ignoreAliasError: true,
            ignoreSelectError: true,
        });

        this.setState({parentAliases});
    };

    //Generates a temporary id for add/delete of the import aliases
    static generateAliasId() {
        return generateId("sampleset-parent-import-alias-");
    }

    parentAliasChanges = (id:string, field: string, newValue: any): void => {

        let {parentAliases} = this.state;
        parentAliases.get(id)[field] = newValue;

        this.setState({parentAliases});
    };

    renderParentAliases() {
        const {parentAliases, parentOptions} = this.state;

        if (!parentAliases || !parentOptions)
            return [];

        return parentAliases.valueSeq().map((parentAlias) =>
            <SampleSetParentAliasRow
                key={parentAlias.id}
                id={parentAlias.id}
                parentAlias={parentAlias}
                parentOptions={parentOptions}
                onAliasChange={this.parentAliasChanges}
                onRemove={this.removeParentAlias}
            />
        );
    }

    removeParentAlias = (id: string): void => {
        let {parentAliases} = this.state;
        if (parentAliases.size === 0)
            return;

        parentAliases = parentAliases.remove(id);
        this.setState((state) => ({
            formValues: {
                ...state.formValues,
            } as ISampleSetDetails,
            parentAliases,
        }));
    };

    renderAddEntityHelper = ():any => {
        return (
            <>
                <span>
                    {PARENT_ALIAS_HELPER_TEXT}
                    <p>{helpLinkNode(DERIVE_SAMPLES_ALIAS_TOPIC, "More info")}</p>
                </span>
            </>
        );
    };

    // ############################# Domain Panel methods
    initDomain = (domain: DomainDesign): void => {
        this.setState(() => ({
            domain
        }));
    };

    domainChangeHandler = (newDomain: DomainDesign) => {
        const {defaultSampleFieldConfig} = this.props;
        let invalidDomainField = undefined;
        if (newDomain && newDomain.fields) {
            newDomain.fields.forEach(field => {
                if (field && field.name && field.name.toLowerCase() === defaultSampleFieldConfig.name.toLowerCase())
                {
                    invalidDomainField = field.name
                }
            });
        }

        this._dirty = true;
        this.setState(() => ({domain: newDomain, invalidDomainField}));
    };

    renderDomainPanel = () => {
        const {domain} = this.state;

        return (
            <>
                {domain &&
                <DomainForm
                        domain={domain}
                        onChange={this.domainChangeHandler}
                        showHeader={true}
                        initCollapsed={true}
                        collapsible={true}
                        helpNoun={'sample type'}
                    // containerTop={STICKY_HEADER_HEIGHT}
                        useTheme={false}
                        appPropertiesOnly={true}
                />
                }
            </>
        );
    };

// ############################ END Domain Panel region
//
//     renderDetailsPanel = () => {
//         const { nameExpressionInfoUrl, nameExpressionPlaceholder } = this.props;
//         const { parentOptions } = this.state;
//
//         const moreInfoLink = nameExpressionInfoUrl ?
//             <p><a target={'_blank'} href={nameExpressionInfoUrl}>More info</a></p> :
//             '';
//
//         return (
//             <>
//                 <Panel>
//                     <Panel.Body>
//                         <div className={'sample-insert--headerhelp'}>
//                             Sample types help you organize samples in your lab and allow you to add properties for easy tracking of data.
//                         </div>
//                         <Form>
//                             {!this.isExistingSampleSet() && <Row className={'margin-bottom'}>
//                                 <Col xs={3}>
//                                     <LabelOverlay
//                                             isFormsy={false}
//                                             labelClass={'sample-insert--overlaylabel'}
//                                             label={'Name'}
//                                             type={'Text (String)'}
//                                             description={`The name for this ${SAMPLE_SET_DISPLAY_TEXT.toLowerCase()}. Note that this can\'t be changed after ${SAMPLE_SET_DISPLAY_TEXT.toLowerCase()} creation.`}
//                                             required={true}
//                                             canMouseOverTooltip={true}
//                                     />
//                                 </Col>
//                                 <Col xs={9}>
//                                     <FormControl
//                                             id={FORM_IDS.NAME}
//                                             type="text"
//                                             placeholder={`Enter a name for this ${SAMPLE_SET_DISPLAY_TEXT.toLowerCase()}`}
//                                             onChange={this.onFormChange}
//                                     />
//                                 </Col>
//                             </Row>}
//                             <Row className='margin-bottom'>
//                                 <Col xs={3}>
//                                     <LabelOverlay
//                                         label={'Description'}
//                                         type={'Text (String)'}
//                                         description={`A short description for this ${SAMPLE_SET_DISPLAY_TEXT.toLowerCase()}.`}
//                                         canMouseOverTooltip={true}
//                                     />
//                                 </Col>
//                                 <Col xs={9}>
//                                 <textarea
//                                     className="form-control"
//                                     id={FORM_IDS.DESCRIPTION}
//                                     onChange={this.onFormChange}
//                                     value={this.getDescriptionValue()}
//                                 />
//                                 </Col>
//                             </Row>
//                             <Row className={'margin-bottom'}>
//                                 <Col xs={3}>
//                                     <LabelOverlay
//                                         label={'Naming Pattern'}
//                                         type={'Text (String)'}
//                                         description={`Pattern used for generating unique sample IDs for this ${SAMPLE_SET_DISPLAY_TEXT.toLowerCase()}.`}
//                                         content={moreInfoLink}
//                                         canMouseOverTooltip={true}
//                                     />
//                                 </Col>
//                                 <Col xs={9}>
//                                     <FormControl
//                                         id={FORM_IDS.NAME_EXPRESSION}
//                                         type="text"
//                                         placeholder={nameExpressionPlaceholder}
//                                         onChange={this.onFormChange}
//                                         value={this.getNameExpressionValue()}
//                                     />
//                                 </Col>
//                             </Row>
//                             { this.renderParentAliases() }
//                             { parentOptions &&
//                             <Row>
//                                 <Col xs={3}>
//                                 </Col>
//                                 <Col xs={9}>
//                                     <span>
//                                         <AddEntityButton entity="Parent Alias" onClick={this.addParentAlias} helperBody={this.renderAddEntityHelper} />
//                                     </span>
//                                 </Col>
//                             </Row>
//                             }
//                         </Form>
//                     </Panel.Body>
//                 </Panel>
//             </>
//         );
//     };

    // setIsValid() {
    //     const { model, onChange } = this.props;
    //     const hasError = model && model.hasValidProperties();
    //     this.setState(() => ({hasError}), () => onChange(model));
    // }
    //
    // toggleLocalPanel = (evt: any, context: IDomainPropertiesPanelContext): void => {
    //     this.setIsValid();
    //     context.togglePanel(evt, !context.collapsed);
    // };

    renderDetailsPanel = () => {
        // const { collapsible, controlledCollapse, panelStatus, model, useTheme, headerText, noun, nameExpressionInfoUrl, nameExpressionPlaceholder, helpTopic, data } = this.props;
        const {  nameExpressionInfoUrl, nameExpressionPlaceholder, data } = this.props;
        const { hasError, parentOptions, formValues } = this.state;
        const isUpdate = isExistingEntity(formValues, data.options);


        // return (
            {/*<DomainPropertiesPanelContext.Consumer>*/}
                // {(context) =>
        return (
                    <>
                        <Panel
                            // className={getDomainPanelClass(context.collapsed, true, useTheme)}
                            // expanded={!context.collapsed}
                            // onToggle={function () {
                            /*}}*/
                        >
                            {/*<CollapsiblePanelHeader*/}
                            {/*    id={PROPERTIES_HEADER_ID}*/}
                            {/*    title={noun + ' Properties'}*/}
                            {/*    titlePrefix={model.name}*/}
                            {/*    togglePanel={(evt: any) => this.toggleLocalPanel(evt, context)}*/}
                            {/*    collapsed={context.collapsed}*/}
                            {/*    collapsible={collapsible}*/}
                            {/*    controlledCollapse={controlledCollapse}*/}
                            {/*    panelStatus={panelStatus}*/}
                            {/*    isValid={hasError}*/}
                            {/*    iconHelpMsg={isUpdate ? UPDATE_ERROR : CREATE_ERROR }*/}
                            {/*    useTheme={useTheme}*/}
                            {/*/>*/}
                            <Panel.Body>
                                <div className={'entity-form--headerhelp'}>
                                    Sample types help you organize samples in your lab and allows you to add properties
                                    for easy tracking of data.
                                </div>
                                <EntityDetailsForm
                                    noun={'Sample Type'}
                                    onFormChange={this.onFormChange}
                                    data={data.options}
                                    formValues={formValues}
                                    nameExpressionInfoUrl={nameExpressionInfoUrl}
                                    nameExpressionPlaceholder={nameExpressionPlaceholder}
                                />
                                {this.renderParentAliases()}
                                {parentOptions &&
                                <Row>
                                    <Col xs={3}>
                                    </Col>
                                    <Col xs={9}>
                                    <span>
                                        <AddEntityButton entity="Parent Alias" onClick={this.addParentAlias}
                                                         helperBody={this.renderAddEntityHelper}/>
                                    </span>
                                    </Col>
                                </Row>
                                }
                            </Panel.Body>
                        </Panel>
                    </>
                // }
            // </DomainPropertiesPanelContext.Consumer>
        )
    };

    render() {
        // const { onCancel, nameExpressionInfoUrl, nameExpressionPlaceholder, data } = this.props;
        // const { submitting, error, parentOptions, formValues } = this.state;
        const { onCancel } = this.props;
        const { submitting, error, } = this.state;
        return (
            <>
                {error && <Alert>{error}</Alert>}
                {this.renderDetailsPanel()}
                {this.renderDomainPanel()}
                <WizardNavButtons
                    containerClassName="margin-top"
                    cancel={onCancel}
                    finish={true}
                    canFinish={this.isFormValid()}
                    isFinishing={submitting}
                    nextStep={this.onFinish}
                    finishText={"Save"}
                    isFinishingText={"Saving..."}
                />
            </>
        );
    }
}
