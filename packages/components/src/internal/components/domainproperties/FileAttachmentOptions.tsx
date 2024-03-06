import React, { FC, memo, ReactNode, useCallback, useMemo } from 'react';

import { FormControl } from 'react-bootstrap';

import { ITypeDependentProps } from './models';
import { SectionHeading } from './SectionHeading';
import { createFormInputId, createFormInputName } from './utils';
import { DOMAIN_FIELD_FILE_DISPLAY, FILE_DISPLAY_ATTACHMENT, FILE_DISPLAY_INLINE } from './constants';
import { isFieldFullyLocked } from './propertiesUtil';

interface Props extends ITypeDependentProps {
    displayOption: string;
}

export const FileAttachmentOptions: FC<Props> = memo(props => {
    const { onChange, label, index, domainIndex, displayOption, lockType } = props;

    const onFieldChange = useCallback(
        (evt): void => {
            const value = evt.target.value;

            if (onChange) {
                onChange(evt.target.id, value);
            }
        },
        [onChange]
    );

    const helpText = useMemo((): ReactNode => {
        return (
            <>
                <p>
                    {`Set the default behavior of ${label.toLowerCase()} links when clicked in grids and elsewhere in LabKey.`}
                </p>
            </>
        );
    }, [label]);

    return (
        <div>
            <div className="row">
                <div className="col-xs-12">
                    <SectionHeading title={`${label} Behavior`} helpTipBody={helpText} />
                </div>
            </div>
            <div className="row domain-field-label">
                <div className="col-xs-2">
                    <FormControl
                        componentClass="select"
                        id={createFormInputId(DOMAIN_FIELD_FILE_DISPLAY, domainIndex, index)}
                        disabled={isFieldFullyLocked(lockType)}
                        name={createFormInputName(DOMAIN_FIELD_FILE_DISPLAY)}
                        onChange={onFieldChange}
                        value={displayOption}
                    >
                        <option
                            key={createFormInputId(
                                DOMAIN_FIELD_FILE_DISPLAY + 'option-' + FILE_DISPLAY_INLINE,
                                domainIndex,
                                index
                            )}
                            value={FILE_DISPLAY_INLINE}
                        >
                            {`Show ${label} in Browser`}
                        </option>
                        <option
                            key={createFormInputId(
                                DOMAIN_FIELD_FILE_DISPLAY + 'option-' + FILE_DISPLAY_ATTACHMENT,
                                domainIndex,
                                index
                            )}
                            value={FILE_DISPLAY_ATTACHMENT}
                        >
                            {`Download ${label}`}
                        </option>
                    </FormControl>
                </div>
            </div>
        </div>
    );
});
