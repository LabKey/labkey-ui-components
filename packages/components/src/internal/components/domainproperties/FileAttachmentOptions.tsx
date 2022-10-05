
import React, {FC, memo, ReactNode, useCallback, useMemo} from 'react';
import {ITypeDependentProps} from "./models";
import {Col, FormControl, Row} from "react-bootstrap";
import {SectionHeading} from "./SectionHeading";
import {DomainFieldLabel} from "./DomainFieldLabel";
import {createFormInputId, createFormInputName} from "./utils";
import {
    DOMAIN_FIELD_FILE_DISPLAY,
    FILE_DISPLAY_ATTACHMENT,
    FILE_DISPLAY_INLINE
} from "./constants";
import {isFieldFullyLocked} from "./propertiesUtil";

interface Props extends ITypeDependentProps {
    displayOption: string;
}


export const FileAttachmentOptions: FC<Props> = memo(props => {
    const { onChange, label, index, domainIndex, displayOption, lockType } = props;

    const onFieldChange = useCallback((evt): void => {
        const value = evt.target.value;

        if (onChange) {
            onChange(evt.target.id, value);
        }
    }, [onChange]);

    const helpText = useMemo((): ReactNode => {
        return (
            <>
                <p>
                    Set the default behavior of file links when clicked in grids and elsewhere in LabKey.
                </p>
            </>
        );
    }, []);


    return (
        <div>
            <Row>
                <Col xs={12}>
                    <SectionHeading title={label} helpTipBody={helpText} />
                </Col>
            </Row>
            <Row className={'domain-field-label'}>
                <Col xs={2}>
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
                            Show File in Browser
                        </option>
                        <option
                            key={createFormInputId(
                                DOMAIN_FIELD_FILE_DISPLAY + 'option-' + FILE_DISPLAY_ATTACHMENT,
                                domainIndex,
                                index
                            )}
                            value={FILE_DISPLAY_ATTACHMENT}
                        >
                            Download File
                        </option>
                    </FormControl>
                </Col>
            </Row>
        </div>
    )

});
