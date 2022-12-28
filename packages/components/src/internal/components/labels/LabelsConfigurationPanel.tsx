import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Button, FormGroup } from 'react-bootstrap';

import { List } from 'immutable';

import { InjectedRouteLeaveProps } from '../../util/RouteLeave';
import { ComponentsAPIWrapper } from '../../APIWrapper';
import { Alert } from '../base/Alert';

import { AddEntityButton } from '../buttons/AddEntityButton';

import { LoadingSpinner } from '../base/LoadingSpinner';
import { ConfirmModal } from '../base/ConfirmModal';
import { DomainFieldLabel } from '../domainproperties/DomainFieldLabel';
import { deleteRows, insertRows, updateRows } from '../../query/api';
import { resolveErrorMessage } from '../../util/messaging';
import { DisableableButton } from '../buttons/DisableableButton';

import { ChoicesListItem } from '../base/ChoicesListItem';


import { LabelTemplate } from './models';
import { LABEL_TEMPLATE_SQ } from './constants';
import { useServerContext } from '../base/ServerContext';
import { LabelHelpTip } from '../base/LabelHelpTip';

const TITLE = 'Manage Label Templates';
const NEW_LABEL_INDEX = -1;
const SAVING_LOCKED_TIP = 'Currently saving';
const SAVING_LOCKED_TITLE = 'Saving';

interface LabelTemplatesPanelProps extends InjectedRouteLeaveProps {
    api?: ComponentsAPIWrapper;
}

interface LabelTemplatesListProps {
    onSelect: (index: number) => void;
    selected: number;
    templates: LabelTemplate[];
}

interface LabelTemplateDetailsProps {
    isNew: boolean;
    onActionCompleted: (newLabel?: number, isDelete?: boolean) => void;
    onChange: () => void;
    template: LabelTemplate;
}

export const LabelTemplatesList: FC<LabelTemplatesListProps> = memo(props => {
    const { onSelect, selected, templates } = props;
    if (!templates || templates.length === 0)
        return <div className="choices-list__empty-message">No label templates registered.</div>;

    return (
        <>
            <div className="list-group">
                {templates.map((template, index) => (
                    <ChoicesListItem
                        active={index === selected}
                        index={index}
                        subLabel={template.path}
                        key={template.rowId}
                        label={template.name}
                        onSelect={onSelect}
                    />
                ))}
            </div>
        </>
    );
});

const normalizeValues = (template: LabelTemplate): LabelTemplate => {
    if (!template) throw Error('Unable to save, invalid template');

    return new LabelTemplate({
        name: template.name?.trim(),
        description: template.description,
        path: template.path?.trim(),
        rowId: template.rowId,
    });
};

export const LabelTemplateDetails: FC<LabelTemplateDetailsProps> = memo(props => {
    const { template, isNew, onChange, onActionCompleted } = props;
    const [updatedTemplate, setUpdateTemplate] = useState<LabelTemplate>();
    const [dirty, setDirty] = useState<boolean>();
    const [saving, setSaving] = useState<boolean>();
    const [error, setError] = useState<string>();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>();

    useEffect(() => {
        if (isNew) {
            setUpdateTemplate(new LabelTemplate({}));
            onChange();
        } else {
            setUpdateTemplate(template);
        }

        setDirty(isNew);
    }, [isNew, onChange, template]);

    const onCancel = useCallback(() => {
        onActionCompleted(undefined, true);
    }, [onActionCompleted]);

    const onToggleDeleteConfirm = useCallback(() => setShowDeleteConfirm(!showDeleteConfirm), [showDeleteConfirm]);
    const onConfirmDelete = useCallback(() => {
        if (updatedTemplate.rowId) {
            deleteRows({
                schemaQuery: LABEL_TEMPLATE_SQ,
                rows: [updatedTemplate],
            })
                .then(() => onActionCompleted(undefined, true))
                .catch(reason => {
                    setError(resolveErrorMessage(reason, 'template', 'templates', 'deleting'));
                    onToggleDeleteConfirm();
                });
        } else {
            onToggleDeleteConfirm();
        }
    }, [updatedTemplate, onActionCompleted, onToggleDeleteConfirm]);

    const onFormChange = useCallback(
        (evt): void => {
            const { name, value } = evt.target;
            setUpdateTemplate(updatedTemplate.set(name, value));
            setDirty(true);
            onChange();
        },
        [updatedTemplate, onChange]
    );

    const onSave = useCallback((): void => {
        setError(undefined);
        setSaving(true);

        const templateToSave = normalizeValues(updatedTemplate);

        if (templateToSave.rowId) {
            updateRows({
                schemaQuery: LABEL_TEMPLATE_SQ,
                rows: [templateToSave],
            })
                .then(() => {
                    onActionCompleted(templateToSave.rowId);
                    setSaving(false);
                })
                .catch(reason => {
                    setError(resolveErrorMessage(reason, 'template', 'templates', 'updating'));
                    setSaving(false);
                });
        } else {
            insertRows({
                schemaQuery: LABEL_TEMPLATE_SQ,
                rows: List([templateToSave]),
            })
                .then(() => {
                    onActionCompleted(templateToSave.rowId);
                    setSaving(false);
                })
                .catch(response => {
                    setError(resolveErrorMessage(response.get('error'), 'template', 'templates', 'inserting'));
                    setSaving(false);
                });
        }
    }, [onActionCompleted, updatedTemplate]);

    return (
        <>
            {!updatedTemplate && template !== null && (
                <div className="choices-detail__empty-message">Select template to view details.</div>
            )}
            {updatedTemplate && (
                <form className="form-horizontal content-form choices-detail__form">
                    {error && <Alert>{error}</Alert>}
                    <FormGroup>
                        <div className="col-sm-4">
                            <DomainFieldLabel label="Name" required />
                        </div>
                        <div className="col-sm-8">
                            <input
                                className="form-control"
                                name="name"
                                onChange={onFormChange}
                                disabled={saving}
                                placeholder="Enter label template's display name"
                                type="text"
                                value={updatedTemplate.name ?? ''}
                            />
                        </div>
                    </FormGroup>
                    <FormGroup>
                        <div className="col-sm-4">
                            <DomainFieldLabel label="Description" />
                        </div>
                        <div className="col-sm-8">
                            <textarea
                                className="form-control"
                                name="description"
                                onChange={onFormChange}
                                disabled={saving}
                                value={updatedTemplate.description ?? ''}
                            />
                        </div>
                    </FormGroup>
                    <FormGroup>
                        <div className="col-sm-4">
                            <DomainFieldLabel label="File Path" required />
                            <LabelHelpTip title="BarTender Label Template">
                                <p>
                                    Provide the label template to use with BarTender. The path should be relative to the
                                    default folder configured in the BarTender web service.
                                </p>
                            </LabelHelpTip>
                        </div>
                        <div className="col-sm-8">
                            <input
                                className="form-control"
                                name="path"
                                onChange={onFormChange}
                                disabled={saving}
                                placeholder="Enter relative path to label template"
                                type="text"
                                value={updatedTemplate.path ?? ''}
                            />
                        </div>
                    </FormGroup>
                    <div>
                        {!isNew && (
                            <DisableableButton
                                bsStyle="default"
                                disabledMsg={saving ? SAVING_LOCKED_TIP : undefined}
                                onClick={onToggleDeleteConfirm}
                                title={SAVING_LOCKED_TITLE}
                            >
                                <span className="fa fa-trash" />
                                <span>&nbsp;Delete</span>
                            </DisableableButton>
                        )}
                        {isNew && (
                            <Button bsStyle="default" disabled={saving} onClick={onCancel}>
                                Cancel
                            </Button>
                        )}
                        <Button bsStyle="success" className="pull-right" disabled={!dirty || saving} onClick={onSave}>
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </form>
            )}
            {showDeleteConfirm && (
                <ConfirmModal
                    cancelButtonText="Cancel"
                    confirmButtonText="Yes, Delete"
                    title="Delete Label Template"
                    onCancel={onToggleDeleteConfirm}
                    onConfirm={onConfirmDelete}
                >
                    <div>
                        The <b>{updatedTemplate.name}</b> label template will be deleted.
                        <strong>This cannot be undone.</strong> Do you wish to proceed?
                    </div>
                </ConfirmModal>
            )}
        </>
    );
});

export const LabelsConfigurationPanel: FC<LabelTemplatesPanelProps> = memo(props => {
    const { api, setIsDirty } = props;
    const { user } = useServerContext();
    const [templates, setTemplates] = useState<LabelTemplate[]>([]);
    const [error, setError] = useState<string>();
    const [selected, setSelected] = useState<number>();
    const addNew = useMemo(() => selected === NEW_LABEL_INDEX, [selected]);

    const queryLabelTemplates = useCallback(
        (newLabelTemplate?: number) => {
            setError(undefined);

            api.labelprinting
                .ensureLabelTemplatesList(user)
                .then(labelTemplates => {
                    setTemplates(labelTemplates);
                    if (newLabelTemplate)
                        setSelected(labelTemplates.findIndex(template => template.rowId === newLabelTemplate));
                })
                .catch(() => {
                    setError('Error: Unable to load label templates.');
                });
        },
        [api, user]
    );

    // Load template list
    useEffect(() => {
        queryLabelTemplates();
    }, [queryLabelTemplates]);

    const onSetSelected = useCallback((index: number) => {
        setSelected(index);
    }, []);

    const onAddLabel = useCallback(() => {
        setSelected(NEW_LABEL_INDEX);
    }, []);

    const onChange = useCallback(() => {
        setIsDirty(true);
    }, [setIsDirty]);

    const onActionCompleted = useCallback(
        (newLabelTemplate?: number, isDelete = false): void => {
            queryLabelTemplates(newLabelTemplate);
            if (isDelete) setSelected(undefined);
            setIsDirty(false);
        },
        [queryLabelTemplates, setIsDirty]
    );

    return (
        <div className="panel panel-default label-templates-container">
            <div className="list__bold-text">{TITLE}</div>
            <div>
                {error && <Alert>{error}</Alert>}
                {!templates && <LoadingSpinner />}
                {templates && !error && (
                    <div className="row choices-container">
                        <div className="col-lg-4 col-md-6 choices-container-left-panel">
                            <LabelTemplatesList templates={templates} selected={selected} onSelect={onSetSelected} />
                            <AddEntityButton onClick={onAddLabel} entity="New Label Template" disabled={addNew} />
                        </div>
                        <div className="col-lg-8 col-md-6">
                            <LabelTemplateDetails
                                // use null to indicate that no label templates exist to be selected, so don't show the empty message
                                template={templates.length === 0 ? null : templates[selected]}
                                isNew={addNew}
                                onActionCompleted={onActionCompleted}
                                onChange={onChange}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});
