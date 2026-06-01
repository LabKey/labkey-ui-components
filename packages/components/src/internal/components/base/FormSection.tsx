/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, PropsWithChildren, ReactNode } from 'react';
import classNames from 'classnames';
import { Utils } from '@labkey/api';

interface Props extends PropsWithChildren {
    addContent?: ReactNode;
    iconSpacer?: boolean;
    label?: ReactNode;
    onAddClick?: () => void;
    showLabel?: boolean;
}

export const FormSection: FC<Props> = ({
    addContent,
    children,
    iconSpacer = true,
    label,
    onAddClick,
    showLabel = true,
}) => (
    <>
        {showLabel && label !== undefined && (
            <div className="row">
                <div className="col-sm-12">
                    {Utils.isString(label) ? (
                        <label className="control-label text-left">
                            <strong>{label}</strong>
                        </label>
                    ) : (
                        label
                    )}
                </div>
            </div>
        )}
        <div className="row">
            <div className="col-sm-12">
                <div
                    className={classNames('wizard-row--container', {
                        'wizard-row--spacer': iconSpacer,
                    })}
                >
                    {children}
                    {addContent && (
                        <div className="add-row--container" onClick={onAddClick}>
                            {addContent}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </>
);
FormSection.displayName = 'FormSection';
