/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';

import { LoadingSpinner } from '../base/LoadingSpinner';
import { Alert } from '../base/Alert';
import { ColorIcon } from '../base/ColorIcon';
import { LabelHelpTip } from '../base/LabelHelpTip';
import { Modal } from '../../Modal';
import { ChoicesListItem } from '../base/ChoicesListItem';
import { AddEntityButton } from '../buttons/AddEntityButton';
import { DisableableButton } from '../buttons/DisableableButton';
import { DomainFieldLabel } from '../domainproperties/DomainFieldLabel';
import { ColorPickerInput } from '../forms/input/ColorPickerInput';
import { SCHEMAS } from '../../schemas';
import { resolveErrorMessage } from '../../util/messaging';
import { InjectedRouteLeaveProps } from '../../util/RouteLeave';
import { useAppContext } from '../../AppContext';
import { Container } from '../base/models/Container';

import { DataTypeSelector } from '../entities/DataTypeSelector';
import { SampleTypeDataType } from '../entities/constants';

import { SampleColorModel } from './models';

const TITLE = 'Manage Sample Colors';
const NEW_COLOR_INDEX = -1;
const MAX_DATA_COLORS = 200;
const MAX_LABEL_LENGTH = 64; // matches exp.DataColors.Label VARCHAR(64) and the server-side validation
const AT_LIMIT_HELP =
    'The maximum of ' +
    MAX_DATA_COLORS +
    ' sample colors (active and archived) has been reached. Delete a color before adding a new one.';
const ARCHIVED_HELP =
    "Archived colors can't be applied to future samples, but may still be applied to existing samples.";
const APPLIES_TO_HELP =
    'Choose which sample types this color can be applied to. All sample types are enabled by default; unchecking one excludes this color from that sample type.';

function newColor(): SampleColorModel {
    return { archived: false, color: undefined, label: undefined };
}

interface SampleColorDetailProps {
    color: SampleColorModel;
    container?: Container;
    isNew: boolean;
    onActionComplete: (newColorLabel?: string, isDelete?: boolean) => void;
    onChange: () => void;
}

// exported for jest testing
export const SampleColorDetail: FC<SampleColorDetailProps> = memo(props => {
    const { color, isNew, onActionComplete, onChange, container } = props;
    const [updated, setUpdated] = useState<SampleColorModel>();
    const [dirty, setDirty] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string>();
    const [deleteError, setDeleteError] = useState<string>();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
    const [excludedTypes, setExcludedTypes] = useState<Set<number>>(new Set());
    // The exclusions as loaded, so Save can send only the delta (newly disabled / newly enabled) rather than the full set.
    const [initialExcludedTypes, setInitialExcludedTypes] = useState<Set<number>>(new Set());
    const [exclusionsLoaded, setExclusionsLoaded] = useState<boolean>(false);
    const [typesError, setTypesError] = useState<string>();
    const { api } = useAppContext();

    useEffect(() => {
        setUpdated(isNew ? newColor() : color);
        setDirty(isNew);
        setSaving(false);
        setShowDeleteConfirm(false);
        setError(undefined);
        if (isNew) onChange();
    }, [color, isNew, onChange]);

    // Load this color's current sample-type exclusions (DataTypeSelector loads the sample-type list itself). A new
    // color has none yet, so it starts with everything enabled and can be created with exclusions.
    useEffect(() => {
        setTypesError(undefined);
        if (isNew || !color?.rowId) {
            setExcludedTypes(new Set());
            setInitialExcludedTypes(new Set());
            setExclusionsLoaded(true);
            return;
        }
        setExclusionsLoaded(false);
        let cancelled = false;
        (async () => {
            try {
                const excluded = await api.samples.getColorSampleTypeExclusions(color.rowId, container?.path);
                if (cancelled) return;
                setExcludedTypes(new Set(excluded));
                setInitialExcludedTypes(new Set(excluded));
                setExclusionsLoaded(true);
            } catch (e) {
                if (!cancelled) setTypesError('Unable to load sample type exclusions.');
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [api, color?.rowId, container?.path, isNew]);

    // DataTypeSelector reports the full set of unchecked (excluded) sample-type rowIds on every change / select-all.
    const onExcludedTypesChange = useCallback(
        (_dataType: string, unchecked: number[]): void => {
            setExcludedTypes(new Set(unchecked));
            setDirty(true);
            onChange();
        },
        [onChange]
    );

    const onLabelChange = useCallback(
        (evt): void => {
            setUpdated(prev => ({ ...prev, label: evt.target.value }));
            setDirty(true);
            onChange();
        },
        [onChange]
    );

    const onColorChange = useCallback(
        (name: string, value: string): void => {
            setUpdated(prev => ({ ...prev, color: value }));
            setDirty(true);
            onChange();
        },
        [onChange]
    );

    const saveColor = useCallback(
        (toSave: SampleColorModel, exclusionDelta?: { newlyDisabled: number[]; newlyEnabled: number[] }) => {
            setError(undefined);
            setSaving(true);
            api.samples
                .updateColorSettings(
                    toSave,
                    exclusionDelta?.newlyDisabled ?? [],
                    exclusionDelta?.newlyEnabled ?? [],
                    container?.path
                )
                .then(() => onActionComplete(toSave.label))
                .catch(reason => {
                    setError(resolveErrorMessage(reason?.error ?? reason, 'color', 'colors', 'save'));
                    setSaving(false);
                });
        },
        [api, container?.path, onActionComplete]
    );

    const onSave = useCallback(() => {
        const toSave = { ...updated, label: updated.label?.trim() };
        const exclusionDelta = {
            newlyDisabled: Array.from(excludedTypes).filter(id => !initialExcludedTypes.has(id)),
            newlyEnabled: Array.from(initialExcludedTypes).filter(id => !excludedTypes.has(id)),
        };
        saveColor(toSave, exclusionDelta);
    }, [updated, excludedTypes, initialExcludedTypes, saveColor]);

    const onToggleArchive = useCallback(() => {
        saveColor({ ...updated, archived: !updated.archived });
    }, [updated, saveColor]);

    const onToggleDeleteConfirm = useCallback(() => {
        setDeleteError(undefined);
        setShowDeleteConfirm(s => !s);
    }, []);
    const onDeleteConfirm = useCallback(() => {
        setDeleteError(undefined);
        setSaving(true);
        api.query
            .deleteRows({
                schemaQuery: SCHEMAS.EXP_TABLES.DATA_COLORS,
                containerPath: container?.path,
                rows: [updated],
            })
            .then(() => onActionComplete(undefined, true))
            .catch(reason => {
                setDeleteError(resolveErrorMessage(reason?.error ?? reason, 'color', 'colors', 'delete'));
                setSaving(false);
            });
    }, [api, container?.path, onActionComplete, updated]);

    if (!updated && color !== null) {
        return <p className="choices-detail__empty-message">Select a sample color to view details.</p>;
    }
    if (!updated) return null;

    const canSave = dirty && !saving && !!updated.color && !!updated.label?.trim();
    const deleteDisabledMsg = saving
        ? 'Please wait for the current operation to finish.'
        : updated.inUse
          ? 'This color is in use by one or more samples and cannot be deleted.'
          : undefined;

    return (
        <>
            <form className="form-horizontal content-form">
                {error && <Alert>{error}</Alert>}
                <div className="form-group">
                    <div className="col-sm-4">
                        <DomainFieldLabel id="color-label-label" label="Label" required />
                    </div>
                    <div className="col-sm-8">
                        <input
                            aria-labelledby="color-label-label"
                            className="form-control"
                            disabled={saving}
                            maxLength={MAX_LABEL_LENGTH}
                            name="label"
                            onChange={onLabelChange}
                            placeholder="Enter color label"
                            type="text"
                            value={updated.label ?? ''}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <div className="col-sm-4">
                        <DomainFieldLabel label="Color" required />
                    </div>
                    <div className="col-sm-8">
                        <ColorPickerInput
                            allowRemove
                            disabled={saving}
                            name="color"
                            onChange={onColorChange}
                            value={updated.color}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <div className="col-sm-4">
                        <DomainFieldLabel helpTipBody={APPLIES_TO_HELP} label="Sample Types" />
                    </div>
                    <div className="col-sm-8">
                        {typesError && <Alert>{typesError}</Alert>}
                        {!exclusionsLoaded && !typesError && <LoadingSpinner />}
                        {exclusionsLoaded && (
                            <DataTypeSelector
                                columns={2}
                                container={container}
                                disabled={saving || updated.archived}
                                entityDataType={SampleTypeDataType}
                                noHeader
                                showUncheckedWarning={false}
                                uncheckedEntitiesDB={Array.from(initialExcludedTypes)}
                                updateUncheckedTypes={onExcludedTypesChange}
                            />
                        )}
                    </div>
                </div>
                <div>
                    {!isNew && (
                        <>
                            <DisableableButton disabledMsg={deleteDisabledMsg} onClick={onToggleDeleteConfirm}>
                                <span className="fa fa-trash" />
                                <span>&nbsp;Delete</span>
                            </DisableableButton>
                            <button
                                className="btn btn-default button-left-margin"
                                disabled={saving}
                                onClick={onToggleArchive}
                                type="button"
                            >
                                {updated.archived ? 'Restore' : 'Archive'}
                            </button>
                        </>
                    )}
                    <button className="pull-right btn btn-success" disabled={!canSave} onClick={onSave} type="button">
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </form>
            {showDeleteConfirm && (
                <Modal
                    confirmClass="btn-danger"
                    confirmText="Yes, Delete"
                    onCancel={onToggleDeleteConfirm}
                    onConfirm={onDeleteConfirm}
                    title="Permanently Delete Color?"
                >
                    {deleteError && <Alert>{deleteError}</Alert>}
                    <span>
                        The <b>{updated.label}</b> color will be permanently deleted.
                        <p className="top-padding">
                            <strong>Deletion cannot be undone.</strong> Colors that are in use by samples cannot be
                            deleted. Do you want to proceed?
                        </p>
                    </span>
                </Modal>
            )}
        </>
    );
});
SampleColorDetail.displayName = 'SampleColorDetail';

interface SampleColorsListProps {
    activeColors: SampleColorModel[];
    archivedColors: SampleColorModel[];
    disabled?: boolean;
    onSelect: (rowId: number) => void;
    selectedRowId: number;
}

// exported for jest testing
export const SampleColorsList: FC<SampleColorsListProps> = memo(props => {
    const { activeColors, archivedColors, disabled, onSelect, selectedRowId } = props;
    const [showArchived, setShowArchived] = useState<boolean>(false);
    const toggleArchived = useCallback(() => setShowArchived(s => !s), []);

    const renderItem = useCallback(
        (c: SampleColorModel) => (
            <ChoicesListItem
                active={c.rowId === selectedRowId}
                disabled={disabled && c.rowId !== selectedRowId}
                index={c.rowId}
                key={c.rowId}
                label={<ColorIcon label={c.label} value={c.color} />}
                onSelect={onSelect}
            />
        ),
        [disabled, onSelect, selectedRowId]
    );

    return (
        <>
            <div className="list-group">
                <p className="choices-list__empty-message">
                    Set up colors that can be applied to individual samples, overriding the sample type color.
                </p>
                {activeColors.map(renderItem)}
            </div>
            {archivedColors.length > 0 && (
                <>
                    <div className="choice-section-header">
                        <button
                            aria-expanded={showArchived}
                            className="choice-section-header__toggle"
                            onClick={toggleArchived}
                            type="button"
                        >
                            <span
                                className={classNames('fa', {
                                    'fa-chevron-down': showArchived,
                                    'fa-chevron-right': !showArchived,
                                })}
                            />
                            &nbsp;Archived Colors
                        </button>
                        <LabelHelpTip placement="right">{ARCHIVED_HELP}</LabelHelpTip>
                    </div>
                    {showArchived && <div className="list-group">{archivedColors.map(renderItem)}</div>}
                </>
            )}
        </>
    );
});
SampleColorsList.displayName = 'SampleColorsList';

interface ManageSampleColorsPanelProps extends InjectedRouteLeaveProps {
    homeContainer?: Container;
}

export const ManageSampleColorsPanel: FC<ManageSampleColorsPanelProps> = memo(props => {
    const { setIsDirty, homeContainer } = props;
    const [colors, setColors] = useState<SampleColorModel[]>();
    const [error, setError] = useState<string>();
    const [selectedRowId, setSelectedRowId] = useState<number>();
    const [dirty, setDirty] = useState<boolean>(false);
    const { api } = useAppContext();
    const isNew = selectedRowId === NEW_COLOR_INDEX;

    const loadColors = useCallback(
        (selectLabel?: string) => {
            setError(undefined);
            api.samples
                .getSampleColors(true, true, homeContainer?.path)
                .then(loaded => {
                    setColors(loaded);
                    if (selectLabel) setSelectedRowId(loaded.find(c => c.label === selectLabel)?.rowId);
                })
                .catch(() => {
                    setColors([]);
                    setError('Error: Unable to load sample colors.');
                });
        },
        [api, homeContainer?.path]
    );

    useEffect(() => {
        loadColors();
    }, [loadColors]);

    const onSelect = useCallback((rowId: number) => setSelectedRowId(rowId), []);
    const onAdd = useCallback(() => setSelectedRowId(NEW_COLOR_INDEX), []);
    const onChange = useCallback(() => {
        setIsDirty(true);
        setDirty(true);
    }, [setIsDirty]);

    const onActionComplete = useCallback(
        (newColorLabel?: string, isDelete = false) => {
            loadColors(newColorLabel);
            if (isDelete) setSelectedRowId(undefined);
            setIsDirty(false);
            setDirty(false);
        },
        [loadColors, setIsDirty]
    );

    const { activeColors, archivedColors, selectedColor } = useMemo(() => {
        const active = (colors ?? []).filter(c => !c.archived);
        const archived = (colors ?? []).filter(c => c.archived);
        const selected = isNew ? undefined : (colors ?? []).find(c => c.rowId === selectedRowId);
        return { activeColors: active, archivedColors: archived, selectedColor: selected };
    }, [colors, isNew, selectedRowId]);

    const atLimit = (colors?.length ?? 0) >= MAX_DATA_COLORS;

    return (
        <div className="panel panel-default">
            <h2 className="panel-heading">{TITLE}</h2>
            <div className="panel-body">
                {error && <Alert>{error}</Alert>}
                {!colors && <LoadingSpinner />}
                {colors && !error && (
                    <div className="row choices-container">
                        <div className="col-lg-4 col-md-6 choices-container-left-panel">
                            <SampleColorsList
                                activeColors={activeColors}
                                archivedColors={archivedColors}
                                disabled={dirty}
                                onSelect={onSelect}
                                selectedRowId={selectedRowId}
                            />
                            <AddEntityButton
                                disabled={isNew || atLimit || dirty}
                                entity="Color"
                                helperBody={atLimit ? AT_LIMIT_HELP : undefined}
                                onClick={onAdd}
                            />
                        </div>
                        <div className="col-lg-8 col-md-6">
                            <SampleColorDetail
                                color={colors.length === 0 && !isNew ? null : selectedColor}
                                container={homeContainer}
                                isNew={isNew}
                                onActionComplete={onActionComplete}
                                onChange={onChange}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

ManageSampleColorsPanel.displayName = 'ManageSampleColorsPanel';
