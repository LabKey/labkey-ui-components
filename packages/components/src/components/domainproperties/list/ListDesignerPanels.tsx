import React from 'react';
import { Alert, Button, Col, FormControl, Row } from "react-bootstrap";
import { List } from "immutable";
import {ActionURL} from "@labkey/api";
import { ListPropertiesPanel } from "./ListPropertiesPanel";
import { DomainDesign, DomainField, IAppDomainHeader, IDomainField } from "../models";
import DomainForm from "../DomainForm";
import { getDomainBottomErrorMessage, getDomainHeaderName, getDomainPanelStatus, saveDomain, newListDesign, saveListDesign } from "../actions";
import { LabelHelpTip, importData } from "../../..";
import { SEVERITY_LEVEL_ERROR } from "../constants";
import { ListModel } from "./models";
import { SetKeyFieldNamePanel } from './SetKeyFieldNamePanel';

// todo: give this its own file
class SetKeyFieldName extends React.PureComponent<IAppDomainHeader> {
    render() {
        let fieldNames= [];
        if (this.props.domain) {
            const fields = this.props.domain.fields;
            // console.log("SetKeyFieldName", fields);

            fieldNames = fields && fields.reduce(function(accum: String[], field: IDomainField) {
                const dataType = field.dataType.name;
                if ((dataType == 'string' || dataType == 'int') && (typeof field.name !== 'undefined') && (field.name.trim().length > 0)) {
                    accum.push(field.name);
                }
                return accum;
            }, []);
        }

        const {onKeyFieldChange, keyField} = this.props;
        console.log("SetKeyFieldNameProps", this.props);
        return(
            <Alert>
                <div>
                    Select a key value for this list which uniquely identifies the item. You can use "Auto integer key" to define your own below.
                </div>
                <Row style={{marginTop:"15px"}}>
                    <Col xs={3} style={{color: "black"}}>
                        Key Field Name
                        <LabelHelpTip
                            title={""}
                            body={() => {return (<> Only integer or text fields can be made the primary key. </>)}}
                        />
                        *
                    </Col>
                    <Col xs={3}>
                        <FormControl
                            componentClass="select"
                            name="keyField"
                            onChange={(e) => onKeyFieldChange(e)}
                            value={keyField}
                            style={{width: "200px"}}
                        >
                            {/*<option disabled value={-2}>*/}
                            {/*    Select a field from the list*/}
                            {/*</option>*/}
                            <option value={-1}>
                                Auto integer key
                            </option>

                            {fieldNames.map((fieldName, index) => {
                                return(
                                    <option value={index} key={index + 1}>
                                        {fieldName}
                                    </option>
                                )
                            })}
                        </FormControl>
                    </Col>
                </Row>
            </Alert>
        );
    }
}

interface Props {
    initModel: ListModel
    onChange?: (model: ListModel) => void
    onCancel: () => void
    onComplete: (model: ListModel) => void
    useTheme?: boolean
    containerTop?: number
    successBsStyle?: string
}

interface State {
    model: ListModel;
    keyField: number;
    submitting: boolean;
    currentPanelIndex: number;
    visitedPanels: List<number>;
    validatePanel: number;
    firstState: boolean;
    fileImportData?: any;
}

export class ListDesignerPanels extends React.PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            model: props.initModel || ListModel.create({}),
            keyField: -1,
            submitting: false,
            currentPanelIndex: 0,
            visitedPanels: List<number>(),
            validatePanel: undefined,
            firstState: true,
        };
    }

    onTogglePanel = (index: number, collapsed: boolean, callback: () => any) => {
        const { visitedPanels, currentPanelIndex } = this.state;

        let updatedVisitedPanels = visitedPanels;
        if (!visitedPanels.contains(index)) {
            updatedVisitedPanels = visitedPanels.push(index);
        }

        if (!collapsed) {
            this.setState(
                () => ({
                    visitedPanels: updatedVisitedPanels,
                    currentPanelIndex: index,
                    firstState: false,
                    validatePanel: currentPanelIndex,
                }),
                callback()
            );
        } else {
            if (currentPanelIndex === index) {
                this.setState(
                    () => ({
                        visitedPanels: updatedVisitedPanels,
                        currentPanelIndex: undefined,
                        firstState: false,
                        validatePanel: currentPanelIndex,
                    }),
                    callback()
                );
            } else {
                callback();
            }
        }
    };

    onPropertiesChange = (model: ListModel) => {
        const { onChange } = this.props;

        this.setState(() => ({model}), () => {
            if (onChange) {
                onChange(model);
            }
        });
    };

    setFileImportData = fileImportData => {
        this.setState({ fileImportData });
        console.log('setFileImportData', fileImportData);
    };

    onDomainChange = (domain: DomainDesign) => {
        const { onChange } = this.props;

        this.setState((state) => ({
            model: state.model.merge({domain}) as ListModel
        }), () => {
            if (onChange) {
                onChange(this.state.model);
            }
        });
    };

    handleFileImport() {
        const { fileImportData, model } = this.state;
        const file = fileImportData;

        importData({
            schemaName: 'lists',
            queryName: model.name,
            file,
            importUrl: ActionURL.buildURL(
                'list',
                'UploadListItems',
                null,
                {'name': model.name})
            // need listId param
        })
        .then((response) => {
            console.log("handleFileImport success", response);
            this.setState(() => ({submitting: false}));
            this.props.onComplete(model);
        })
        .catch((error) => {
            console.log("handleFileImport error", error);
            // TODO
        });
    }

    onFinish = () => {
        const { model, visitedPanels, currentPanelIndex, fileImportData } = this.state;

        let updatedVisitedPanels = visitedPanels;
        if (!visitedPanels.contains(currentPanelIndex)) {
            updatedVisitedPanels = visitedPanels.push(currentPanelIndex);
        }

        // This first setState forces the current expanded panel to validate its fields and display and errors
        // the callback setState then sets that to undefined so it doesn't keep validating every render
        this.setState(
            state => ({ validatePanel: state.currentPanelIndex, visitedPanels: updatedVisitedPanels }),
            () => {
                this.setState(
                    () => ({ validatePanel: undefined }),
                    () => {
                        if (this.isValid()) {
                            this.setState(() => ({ submitting: true }));

                    saveDomain(model.domain, model.getDomainKind(), model.getOptions(), model.name)
                        .then((response) => {
                            let updatedModel = model.set('exception', undefined) as ListModel;
                            updatedModel = updatedModel.merge({domain: response}) as ListModel;
                            this.setState(() => ({model: updatedModel}));

                            // If we're importing List file data, import file contents
                            if (fileImportData) {
                                this.handleFileImport();
                            }
                            else {
                                this.setState(() => ({submitting: false}));
                                this.props.onComplete(updatedModel);
                            }
                        })
                        .catch((response) => {
                            const updatedModel = model.set('exception', response.exception) as ListModel;
                            this.setState(() => ({model: updatedModel, submitting: false}));
                        });
                }
            });
        });
    };

    isValid(): boolean {
        return ListModel.isValid(this.state.model);
    }

    // to reviewer: this is kind of ungainly. Is there a better way?
    // TODO: use merge instead
    onKeyFieldChange = e => {
        const { name, value } = e.target;

        this.setState(
            state => {
                const oldFields = state.model.domain.fields as List<DomainField>;
                const oldPKIndex = state.keyField;

                // Toggle off primary key on deselected field
                const oldKeyField = oldFields.get(oldPKIndex) as DomainField;
                const updatedOldKeyField = oldKeyField.set('isPrimaryKey', false) as DomainField;

                // Toggle on primary key on newly selected field
                const newKeyField = oldFields.get(value);
                const updatedNewKeyField = newKeyField.merge({ isPrimaryKey: true, required: true }) as DomainField;

                const fieldsWithoutPK = oldFields.set(oldPKIndex, updatedOldKeyField) as List<DomainField>;
                const fields = fieldsWithoutPK.set(value, updatedNewKeyField);

                // if chosen key field is 'auto integer,' add corresponding field to fields TODO
                if (value == -1) {
                    const autoIntegerField = DomainField.create({
                        name: 'Auto increment key (placeholder)',
                        required: true,
                        dataType: 'Integer',
                    });

                    console.log('autoIntegerField', autoIntegerField);
                }

                let keyType;
                if (updatedNewKeyField.dataType.name === 'int') {
                    keyType = 'Integer';
                } else if (updatedNewKeyField.dataType.name === 'string') {
                    keyType = 'Varchar';
                }
                const updatedModel = state.model.merge({
                    domain: state.model.domain.set('fields', fields),
                    keyName: updatedNewKeyField.name,
                    keyType,
                }) as ListModel;

                return { model: updatedModel, [name]: value } as State;
            },
            () => {
                console.log('onKeyFieldChange', this.state);
            }
        );
    };

    headerRenderer = (config: IAppDomainHeader) => {
        return (
            <SetKeyFieldNamePanel onKeyFieldChange={this.onKeyFieldChange} keyField={this.state.keyField} {...config} />
        );
    };

    render() {
        const { onCancel, useTheme, containerTop, successBsStyle } = this.props;
        const { model, visitedPanels, currentPanelIndex, firstState, validatePanel } = this.state;

        let errorDomains = List<string>();
        if (model.domain.hasException() && model.domain.domainException.severity === SEVERITY_LEVEL_ERROR) {
            errorDomains = errorDomains.push(getDomainHeaderName(model.domain.name, undefined, model.name));
        }

        const bottomErrorMsg = getDomainBottomErrorMessage(model.exception, errorDomains, model.hasValidProperties(), visitedPanels);

        return (
            <>
                <ListPropertiesPanel
                    model={model}
                    onChange={this.onPropertiesChange}
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== 0}
                    panelStatus={
                        model.isNew()
                            ? getDomainPanelStatus(0, currentPanelIndex, visitedPanels, firstState)
                            : 'COMPLETE'
                    }
                    validate={validatePanel === 0}
                    onToggle={(collapsed, callback) => {
                        this.onTogglePanel(0, collapsed, callback);
                    }}
                    useTheme={useTheme}
                />

                <DomainForm
                    key={model.domain.domainId || 0}
                    domainIndex={0}
                    domain={model.domain}
                    headerTitle={'Fields'}
                    helpTopic={null} // null so that we don't show the "learn more about this tool" link for this domains
                    onChange={this.onDomainChange}
                    setFileImportData={this.setFileImportData}
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== 1}
                    validate={validatePanel === 1}
                    panelStatus={
                        model.isNew()
                            ? getDomainPanelStatus(1, currentPanelIndex, visitedPanels, firstState)
                            : 'COMPLETE'
                    }
                    showInferFromFile={true}
                    containerTop={containerTop}
                    onToggle={(collapsed, callback) => {
                        this.onTogglePanel(1, collapsed, callback);
                    }}
                    useTheme={useTheme}
                    successBsStyle={successBsStyle}
                    appDomainHeaderRenderer={model.isNew() && this.headerRenderer}
                />

                {bottomErrorMsg && (
                    <div className="domain-form-panel">
                        <Alert bsStyle="danger">{bottomErrorMsg}</Alert>
                    </div>
                )}

                <div className='domain-form-panel domain-assay-buttons'>
                    <Button onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        className="pull-right"
                        bsStyle={successBsStyle || 'success'}
                        disabled={this.state.submitting}
                        onClick={this.onFinish}>
                        Save
                    </Button>
                </div>
            </>
        );
    }
}
