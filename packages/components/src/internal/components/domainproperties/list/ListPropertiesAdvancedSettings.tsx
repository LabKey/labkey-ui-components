import React from 'react';
import classNames from 'classnames';
import { Button, FormControl, FormGroup, Modal, Radio } from 'react-bootstrap';
import { faAngleRight, faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { helpLinkNode, LabelHelpTip, ListModel, SelectInput } from '../../../..';

import { DomainFieldLabel } from '../DomainFieldLabel';

import { CheckBox } from './ListPropertiesPanelFormElements';
import { AdvancedSettingsForm } from './models';
import {
    CUSTOM_TEMPLATE_TIP,
    DATA_INDEXING_TIP,
    DISCUSSION_LINKS_TIP,
    DOCUMENT_TITLE_TIP,
    SEARCH_INDEXING_TIP,
} from './constants';

interface DisplayTitleProps {
    model: ListModel;
    onSelectChange: (name, formValue, selected) => void;
    titleColumn: string;
}

export class DisplayTitle extends React.PureComponent<DisplayTitleProps> {
    render() {
        const { model, onSelectChange, titleColumn } = this.props;
        const fields = model.domain.fields;
        const disabled = fields.size === 0;
        const placeholder = disabled ? 'No fields have been defined yet' : 'Auto';

        return (
            <div className="list__advanced-settings-modal__display-title">
                <SelectInput
                    name="titleColumn"
                    options={fields.toArray()}
                    placeholder={placeholder}
                    inputClass="" // This attr is necessary for proper styling
                    valueKey="name"
                    labelKey="name"
                    key="name"
                    formsy={false}
                    multiple={false}
                    required={false}
                    disabled={disabled}
                    onChange={onSelectChange}
                    value={titleColumn}
                />
            </div>
        );
    }
}

interface DiscussionLinksProps {
    onRadioChange: (evt: any) => any;
    discussionSetting: number;
}

class DiscussionLinks extends React.PureComponent<DiscussionLinksProps> {
    render() {
        const { onRadioChange, discussionSetting } = this.props;
        const radioName = 'discussionSetting';

        return (
            <>
                <FormGroup>
                    <Radio name={radioName} value={0} checked={discussionSetting == 0} onChange={onRadioChange}>
                        Disable discussions
                    </Radio>
                    <Radio name={radioName} value={1} checked={discussionSetting == 1} onChange={onRadioChange}>
                        Allow one discussion per item
                    </Radio>
                    <Radio name={radioName} value={2} checked={discussionSetting == 2} onChange={onRadioChange}>
                        Allow multiple discussions per item
                    </Radio>
                </FormGroup>
            </>
        );
    }
}

interface TitleIndexFieldProps {
    name: string;
    titleTemplate: string;
    onInputChange: (evt: any) => any;
}

class TitleIndexField extends React.PureComponent<TitleIndexFieldProps> {
    render() {
        const { name, titleTemplate, onInputChange } = this.props;
        const title = titleTemplate == null ? '' : titleTemplate;
        return (
            <div>
                <DomainFieldLabel label="Document title" helpTipBody={DOCUMENT_TITLE_TIP} />
                <span>
                    <FormControl
                        className="list__advanced-settings-modal__text-field"
                        id={name}
                        type="text"
                        placeholder="Use default"
                        value={title}
                        onChange={onInputChange}
                    />
                </span>
            </div>
        );
    }
}

interface MetadataIndexFieldProps {
    indexSetting: number;
    name: string;
    onRadioChange: (evt: any) => any;
}

class MetadataIndexField extends React.PureComponent<MetadataIndexFieldProps> {
    render() {
        const { indexSetting, name, onRadioChange } = this.props;

        // Note: Currently the radio values go from high to low in order to correspond with the previous
        // designer's order of radio options. Once the old designer is deprecated, we could change these to
        // count from low to high.
        return (
            <div>
                <FormGroup>
                    <Radio name={name} value={2} checked={indexSetting === 2} onChange={onRadioChange}>
                        Include both metadata and data
                        <LabelHelpTip title="Warning">{DATA_INDEXING_TIP}</LabelHelpTip>
                    </Radio>
                    <Radio name={name} value={1} checked={indexSetting === 1} onChange={onRadioChange}>
                        Include data only
                        <LabelHelpTip title="Warning">{DATA_INDEXING_TIP}</LabelHelpTip>
                    </Radio>
                    <Radio name={name} value={0} checked={indexSetting === 0} onChange={onRadioChange}>
                        Include metadata only (name and description of list and fields)
                    </Radio>
                </FormGroup>
            </div>
        );
    }
}

interface IndexFieldProps {
    name: string;
    onRadioChange: (evt: any) => any;
    onInputChange: (evt: any) => any;
    bodySetting: number;
    bodyTemplate: string;
}

export class IndexField extends React.PureComponent<IndexFieldProps> {
    render() {
        const { name, onRadioChange, bodySetting, bodyTemplate, onInputChange } = this.props;
        const id = name === 'entireListBodySetting' ? 'entireListBodyTemplate' : 'eachItemBodyTemplate';

        return (
            <div>
                <FormGroup>
                    <Radio name={name} value={0} checked={bodySetting === 0} onChange={onRadioChange}>
                        Index all non-PHI text fields
                    </Radio>
                    <Radio name={name} value={1} checked={bodySetting === 1} onChange={onRadioChange}>
                        Index all non-PHI fields (text, number, date, and boolean)
                    </Radio>
                    <Radio name={name} value={2} checked={bodySetting === 2} onChange={onRadioChange}>
                        Index using custom template
                        <LabelHelpTip>{CUSTOM_TEMPLATE_TIP}</LabelHelpTip>
                    </Radio>
                </FormGroup>

                {bodySetting == 2 && (
                    <FormControl
                        id={id}
                        type="text"
                        value={bodyTemplate}
                        onChange={onInputChange}
                        className="list__advanced-settings-modal__custom-template-text-field"
                    />
                )}
            </div>
        );
    }
}

interface SingleDocumentIndexFieldsProps {
    onRadioChange: (evt: any) => any;
    onInputChange: (evt: any) => any;
    entireListTitleTemplate: string;
    entireListIndexSetting: number;
    entireListBodySetting: number;
    entireListBodyTemplate: string;
}

export class SingleDocumentIndexFields extends React.PureComponent<SingleDocumentIndexFieldsProps> {
    render() {
        const {
            onRadioChange,
            onInputChange,
            entireListTitleTemplate,
            entireListIndexSetting,
            entireListBodySetting,
            entireListBodyTemplate,
        } = this.props;

        return (
            <div className="list__advanced-settings-modal__single-doc-fields">
                <TitleIndexField
                    titleTemplate={entireListTitleTemplate}
                    name="entireListTitleTemplate"
                    onInputChange={onInputChange}
                />

                <MetadataIndexField
                    name="entireListIndexSetting"
                    onRadioChange={onRadioChange}
                    indexSetting={entireListIndexSetting}
                />

                <IndexField
                    name="entireListBodySetting"
                    onRadioChange={onRadioChange}
                    onInputChange={onInputChange}
                    bodySetting={entireListBodySetting}
                    bodyTemplate={entireListBodyTemplate}
                />
            </div>
        );
    }
}

interface SeparateDocumentIndexFieldsProps {
    onRadioChange: (evt: any) => any;
    onInputChange: (evt: any) => any;
    eachItemTitleTemplate: string;
    eachItemBodySetting: number;
    eachItemBodyTemplate: string;
}

export class SeparateDocumentIndexFields extends React.PureComponent<SeparateDocumentIndexFieldsProps> {
    render() {
        const {
            onRadioChange,
            onInputChange,
            eachItemTitleTemplate,
            eachItemBodySetting,
            eachItemBodyTemplate,
        } = this.props;

        return (
            <div className="list__advanced-settings-modal__single-doc-fields">
                <TitleIndexField
                    titleTemplate={eachItemTitleTemplate}
                    name="eachItemTitleTemplate"
                    onInputChange={onInputChange}
                />

                <IndexField
                    name="eachItemBodySetting"
                    onRadioChange={onRadioChange}
                    onInputChange={onInputChange}
                    bodySetting={eachItemBodySetting}
                    bodyTemplate={eachItemBodyTemplate}
                />
            </div>
        );
    }
}

interface CollapsibleFieldsProps {
    expanded: boolean;
    fields: JSX.Element;
    title: string;
    expandFields: (expandedSection: string) => void;
    collapseFields: () => void;
    identifier: string;
    checked: boolean;
    onCheckboxChange: (name: string, checked: boolean) => void;
}

class CollapsibleFields extends React.PureComponent<CollapsibleFieldsProps> {
    expand = () => {
        const { expanded, expandFields, identifier } = this.props;
        const set = expanded ? '' : identifier;
        expandFields(set);
    };

    onClick = () => {
        const { identifier, checked, onCheckboxChange, collapseFields, expanded } = this.props;
        onCheckboxChange(identifier, checked);
        if (expanded && !checked) {
            // If options are expanded, changing a checkbox from unchecked to checked does not expand or collapse
        } else if (!checked) {
            this.expand();
        } else {
            collapseFields();
        }
    };

    render() {
        const { expanded, fields, title, checked } = this.props;
        const icon = expanded ? faAngleDown : faAngleRight;
        const classes = classNames('list__advanced-settings-model__collapsible-field list__properties__no-highlight', {
            'list__properties__checkbox-unchecked': !checked,
        });

        return (
            <div>
                <span onClick={this.expand} className={classes}>
                    <FontAwesomeIcon icon={icon} size="lg" />
                </span>
                <span className="list__advanced-settings-modal__index-checkbox">
                    <CheckBox checked={checked} onClick={() => this.onClick()} />
                    <span className="list__advanced-settings-modal__index-text">
                        <span className="list__clickable" onClick={() => this.onClick()}>
                            {title}
                        </span>
                        {expanded && fields}
                    </span>
                </span>
            </div>
        );
    }
}

interface SearchIndexingProps {
    onRadioChange: (evt: any) => any;
    onInputChange: (evt: any) => any;
    onCheckboxChange: (name, checked) => void;
    entireListIndexSettings: any;
    eachItemIndexSettings: any;
    fileAttachmentIndex: boolean;
}

interface SearchIndexingState {
    expanded: string;
}

export class SearchIndexing extends React.PureComponent<SearchIndexingProps, SearchIndexingState> {
    constructor(props) {
        super(props);
        this.state = {
            expanded: '', // Neither section initially expanded
        };
    }

    expandFields = expandedSection => {
        this.setState({ expanded: expandedSection });
    };

    collapseFields = () => {
        this.setState({ expanded: '' });
    };

    render() {
        const {
            onRadioChange,
            onCheckboxChange,
            onInputChange,
            entireListIndexSettings,
            eachItemIndexSettings,
            fileAttachmentIndex,
        } = this.props;

        const { expanded } = this.state;

        const singleDocTitle = 'Index entire list as a single document';
        const separateDocTitle = 'Index each item as a separate document';

        return (
            <div>
                <CollapsibleFields
                    expanded={expanded == 'entireListIndex'}
                    fields={
                        <SingleDocumentIndexFields
                            onRadioChange={onRadioChange}
                            onInputChange={onInputChange}
                            {...entireListIndexSettings}
                        />
                    }
                    title={singleDocTitle}
                    identifier="entireListIndex"
                    expandFields={this.expandFields}
                    collapseFields={this.collapseFields}
                    checked={entireListIndexSettings.entireListIndex}
                    onCheckboxChange={onCheckboxChange}
                />

                <CollapsibleFields
                    expanded={expanded == 'eachItemIndex'}
                    fields={
                        <SeparateDocumentIndexFields
                            onRadioChange={onRadioChange}
                            onInputChange={onInputChange}
                            {...eachItemIndexSettings}
                        />
                    }
                    title={separateDocTitle}
                    identifier="eachItemIndex"
                    expandFields={this.expandFields}
                    collapseFields={this.collapseFields}
                    checked={eachItemIndexSettings.eachItemIndex}
                    onCheckboxChange={onCheckboxChange}
                />

                <span className="list__advanced-settings-model__index-checkbox">
                    <CheckBox
                        checked={fileAttachmentIndex}
                        onClick={() => onCheckboxChange('fileAttachmentIndex', fileAttachmentIndex)}
                    />
                    <span
                        className="list__advanced-settings-modal__index-text list__clickable"
                        onClick={() => onCheckboxChange('fileAttachmentIndex', fileAttachmentIndex)}
                    >
                        Index file attachments
                    </span>
                </span>
            </div>
        );
    }
}

interface SettingsContainerProps {
    fieldComponent: JSX.Element;
    title: string;
    tipBody: string | JSX.Element;
    tipTitle?: string;
}

class SettingsContainer extends React.PureComponent<SettingsContainerProps> {
    render() {
        const { fieldComponent, title, tipBody, tipTitle } = this.props;

        return (
            <div className="list__advanced-settings-modal__section-container">
                <div className="list__advanced-settings-modal__heading">
                    <span className="list__bold-text"> {title} </span>
                    <LabelHelpTip title={tipTitle || title}>{tipBody}</LabelHelpTip>
                </div>

                {fieldComponent}
            </div>
        );
    }
}

interface AdvancedSettingsProps {
    model: ListModel;
    title: string;
    applyAdvancedProperties: (advancedSettingsForm: AdvancedSettingsForm) => void;
    successBsStyle?: string;
}

interface AdvancedSettingsState extends AdvancedSettingsForm {
    modalOpen?: boolean;
}

export class AdvancedSettings extends React.PureComponent<AdvancedSettingsProps, AdvancedSettingsState> {
    constructor(props) {
        super(props);
        const initialState = this.getInitialState();

        this.state = {
            modalOpen: false,
            ...initialState,
        } as AdvancedSettingsState;
    }

    getInitialState = () => {
        const model = this.props.model;

        return {
            titleColumn: model.titleColumn,
            discussionSetting: model.discussionSetting,
            fileAttachmentIndex: model.fileAttachmentIndex,

            // entire list
            entireListIndex: model.entireListIndex,
            // document title
            entireListTitleTemplate: model.entireListTitleTemplate,
            // metadata/data
            entireListIndexSetting: model.entireListIndexSetting,
            // index
            entireListBodySetting: model.entireListBodySetting,
            entireListBodyTemplate: model.entireListBodyTemplate,

            // each item
            eachItemIndex: model.eachItemIndex,
            // document title
            eachItemTitleTemplate: model.eachItemTitleTemplate,
            // index
            eachItemBodySetting: model.entireListBodySetting,
            eachItemBodyTemplate: model.eachItemBodyTemplate,
        };
    };

    toggleModal = (isModalOpen: boolean): void => {
        this.setState({ modalOpen: isModalOpen });

        // If modal is re-opened, reset unsaved values
        if (isModalOpen) {
            this.setState(this.getInitialState());
        }
    };

    onRadioChange = e => {
        const name = e.currentTarget.name;
        const value = e.target.value;
        this.setState({ [name]: parseInt(value) });
    };

    onCheckboxChange = (name, checked) => {
        this.setState({ [name]: !checked });
    };

    onInputChange = e => {
        const id = e.target.id;
        const value = e.target.value;

        this.setState({ [id]: value });
    };

    onSelectChange = (name, formValue, selected): void => {
        const value = selected ? selected.name : '<AUTO>';
        this.setState({ [name]: value });
    };

    applyChanges = (): void => {
        const { modalOpen, ...advancedSettingsForm } = this.state;

        this.props.applyAdvancedProperties(advancedSettingsForm as AdvancedSettingsForm);
        this.toggleModal(false);
    };

    render() {
        const {
            modalOpen,
            discussionSetting,
            fileAttachmentIndex,
            entireListIndex,
            entireListTitleTemplate,
            entireListIndexSetting,
            entireListBodySetting,
            eachItemIndex,
            eachItemTitleTemplate,
            eachItemBodySetting,
            titleColumn,
            entireListBodyTemplate,
            eachItemBodyTemplate,
        } = this.state;
        const { title, model, successBsStyle } = this.props;

        const entireListIndexSettings = {
            entireListIndex,
            entireListTitleTemplate,
            entireListIndexSetting,
            entireListBodySetting,
            entireListBodyTemplate,
        };

        const eachItemIndexSettings = {
            eachItemIndex,
            eachItemTitleTemplate,
            eachItemBodySetting,
            eachItemBodyTemplate,
        };

        const displayTitleTip = (
            <>
                Choose a field to identify this list when other lists or datasets have lookups into this list. When
                “Auto” is enabled, LabKey will select the title field for you by using:
                <ul>
                    <li>The first non-lookup string column</li>
                    <li>The primary key, if there are no string fields</li>
                </ul>
            </>
        ) as JSX.Element;

        return (
            <>
                <Button className="domain-field-float-right" onClick={() => this.toggleModal(true)}>
                    {title}
                </Button>

                <Modal show={modalOpen} onHide={() => this.toggleModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title> Advanced List Settings </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <SettingsContainer
                            title="Default Display Field"
                            tipBody={displayTitleTip}
                            fieldComponent={
                                <DisplayTitle
                                    model={model}
                                    onSelectChange={this.onSelectChange}
                                    titleColumn={titleColumn}
                                />
                            }
                        />

                        <SettingsContainer
                            title="Discussion Threads"
                            tipBody={DISCUSSION_LINKS_TIP}
                            fieldComponent={
                                <DiscussionLinks
                                    onRadioChange={this.onRadioChange}
                                    discussionSetting={discussionSetting}
                                />
                            }
                        />

                        <SettingsContainer
                            title="Search Indexing Options"
                            tipBody={SEARCH_INDEXING_TIP}
                            fieldComponent={
                                <SearchIndexing
                                    onRadioChange={this.onRadioChange}
                                    onCheckboxChange={this.onCheckboxChange}
                                    onInputChange={this.onInputChange}
                                    entireListIndexSettings={entireListIndexSettings}
                                    eachItemIndexSettings={eachItemIndexSettings}
                                    fileAttachmentIndex={fileAttachmentIndex}
                                />
                            }
                        />
                    </Modal.Body>

                    <Modal.Footer>
                        <>
                            <Button
                                onClick={() => this.toggleModal(false)}
                                className="domain-adv-footer domain-adv-cancel-btn"
                            >
                                Cancel
                            </Button>

                            {helpLinkNode(
                                'createListOptions#advanced',
                                'Get help with list settings',
                                'domain-adv-footer domain-adv-link'
                            )}

                            <Button
                                onClick={this.applyChanges}
                                bsStyle={successBsStyle || 'success'}
                                className="domain-adv-footer domain-adv-apply-btn"
                            >
                                Apply
                            </Button>
                        </>
                    </Modal.Footer>
                </Modal>
            </>
        );
    }
}
