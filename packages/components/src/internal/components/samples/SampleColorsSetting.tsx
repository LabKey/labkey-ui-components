/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ChangeEvent, FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Modal } from '../../Modal';
import { Alert } from '../base/Alert';
import { ColorIcon } from '../base/ColorIcon';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { useAppContext } from '../../AppContext';
import { useServerContext } from '../base/ServerContext';
import { AppURL } from '../../url/AppURL';
import { AppLink } from '../../url/AppLink';
import { ADMIN_KEY } from '../../app/constants';
import { DomainFieldLabel } from '../domainproperties/DomainFieldLabel';

import { SampleColorModel } from './models';

const MAX_DOTS = 20;
const HELP_TIP = 'Set up colors that can be applied to individual samples, overriding the sample type color.';

interface SampleColorsSelectorModalProps {
    colors: SampleColorModel[];
    initialDisabled: Set<number>;
    onCancel: () => void;
    onConfirm: (disabledRowIds: number[]) => void;
}

// exported for jest testing
export const SampleColorsSelectorModal: FC<SampleColorsSelectorModalProps> = memo(
    ({ colors, initialDisabled, onCancel, onConfirm }) => {
        const [draftDisabled, setDraftDisabled] = useState<Set<number>>(() => new Set(initialDisabled));

        const onToggle = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
            const rowId = parseInt(evt.currentTarget.value, 10);
            setDraftDisabled(prev => {
                const next = new Set(prev);
                if (next.has(rowId)) next.delete(rowId);
                else next.add(rowId);
                return next;
            });
        }, []);

        const onApply = useCallback(() => {
            onConfirm(Array.from(draftDisabled));
        }, [draftDisabled, onConfirm]);

        return (
            <Modal confirmText="Apply" onCancel={onCancel} onConfirm={onApply} title="Edit Sample Colors">
                {colors.length === 0 && <p>No colors are set up yet.</p>}
                <div className="row">
                    {colors.map(c => (
                        <div className="col-sm-4" key={c.rowId}>
                            <label className="checkbox-inline">
                                <input
                                    checked={!draftDisabled.has(c.rowId)}
                                    onChange={onToggle}
                                    type="checkbox"
                                    value={c.rowId}
                                />
                                <ColorIcon label={c.label} useSmall value={c.color} />
                            </label>
                        </div>
                    ))}
                </div>
            </Modal>
        );
    }
);

SampleColorsSelectorModal.displayName = 'SampleColorsSelectorModal';

interface Props {
    onChange: (disabledRowIds: number[]) => void;
    sampleTypeRowId?: number;
}

export const SampleColorsSetting: FC<Props> = memo(({ sampleTypeRowId, onChange }) => {
    const { api } = useAppContext();
    const { user } = useServerContext();
    const [colors, setColors] = useState<SampleColorModel[]>();
    const [disabledSet, setDisabledSet] = useState<Set<number>>(new Set());
    const [error, setError] = useState<string>();
    const [showModal, setShowModal] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            try {
                const allColors = await api.samples.getSampleColors();
                const excluded = sampleTypeRowId ? await api.samples.getSampleTypeColorExclusions(sampleTypeRowId) : [];
                setColors(allColors);
                setDisabledSet(new Set(excluded));
            } catch (e) {
                setColors([]);
                setError('Unable to load sample colors.');
            }
        })();
    }, [api, sampleTypeRowId]);

    const enabledColors = useMemo(() => (colors ?? []).filter(c => !disabledSet.has(c.rowId)), [colors, disabledSet]);

    const openModal = useCallback(() => setShowModal(true), []);

    const closeModal = useCallback(() => setShowModal(false), []);

    const onConfirm = useCallback(
        (disabledRowIds: number[]) => {
            setDisabledSet(new Set(disabledRowIds));
            onChange(disabledRowIds);
            setShowModal(false);
        },
        [onChange]
    );

    return (
        <div className="row margin-top">
            <div className="col-xs-2">
                <DomainFieldLabel helpTipBody={HELP_TIP} label="Sample Colors" />
            </div>
            <div className="col-xs-10">
                {error && <Alert>{error}</Alert>}
                {!colors && <LoadingSpinner />}
                {colors && colors.length === 0 && (
                    <span className="gray-text">
                        No colors are set up yet.
                        {user.isAdmin && (
                            <>
                                {' '}
                                <AppLink to={AppURL.create(ADMIN_KEY, 'settings')}>Add Colors</AppLink>
                            </>
                        )}
                    </span>
                )}
                {colors && colors.length > 0 && (
                    <>
                        <span className="sample-colors-setting__dots">
                            {enabledColors.slice(0, MAX_DOTS).map((c, i, shown) => {
                                const showPlus = enabledColors.length > MAX_DOTS && i === shown.length - 1;
                                return (
                                    <span className="sample-colors-setting__dot" key={c.rowId}>
                                        <ColorIcon value={showPlus ? '#FFFFFF' : c.color} />
                                        {showPlus && <span className="sample-colors-setting__dot-more">+</span>}
                                    </span>
                                );
                            })}
                        </span>
                        <span className="spacer-left">
                            {enabledColors.length} color{enabledColors.length > 1 ? 's' : ''} enabled.
                        </span>
                        <button className="btn btn-link" onClick={openModal} type="button">
                            Edit
                        </button>
                    </>
                )}
            </div>
            {showModal && (
                <SampleColorsSelectorModal
                    colors={colors ?? []}
                    initialDisabled={disabledSet}
                    onCancel={closeModal}
                    onConfirm={onConfirm}
                />
            )}
        </div>
    );
});

SampleColorsSetting.displayName = 'SampleColorsSetting';
