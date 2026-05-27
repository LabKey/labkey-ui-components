import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';

import { List } from 'immutable';

import { FIELD_EDITOR_CALC_COLS_TOPIC, HelpLink, LABKEY_SQL_TOPIC } from '../../util/helpLinks';

import { resolveErrorMessage } from '../../util/messaging';

import { createFormInputId, createFormInputName } from './utils';
import { DOMAIN_FIELD_CLIENT_SIDE_ERROR, DOMAIN_FIELD_VALUE_EXPRESSION, SEVERITY_LEVEL_WARN } from './constants';
import { DomainField, DomainFieldError, GetDomainFields, SystemField } from './models';
import { SectionHeading } from './SectionHeading';
import { isFieldFullyLocked, isFieldPartiallyLocked } from './propertiesUtil';
import { CALCULATED_TYPE, MULTI_CHOICE_TYPE, PropDescType } from './PropDescType';
import { SVGIcon } from '../base/SVGIcon';
import { useModalState } from '../../hooks';
import { EXPR_ASST_METRIC_FEATURE_AREA, ExpressionAssistantModal } from './ExpressionAssistantModal';
import { incrementClientSideMetricCount } from '../../actions';
import { useAppContext } from '../../AppContext';
import { useServerContext } from '../base/ServerContext';

// export for jest testing
export const typeToDisplay = (type: string): string => {
    if (!type || type.toLowerCase() === 'other') {
        return 'Unknown';
    } else if (type.toLowerCase() === 'int' || type.toLowerCase() === 'integer') {
        return 'Integer';
    } else if (type.toLowerCase() === 'double' || type.toLowerCase() === 'decimal') {
        return 'Decimal (floating point)';
    } else if (type.toLowerCase() === 'varchar') {
        return 'Text';
    } else if (type.toLowerCase() === 'date') {
        return 'Date Time';
    }
    return type;
};

// export for jest testing
export const getColumnTypeMap = (
    domainFields?: DomainField[],
    systemFields?: SystemField[]
): Record<string, string> => {
    // Issue 51169: add some default system fields
    const colTypeMap = {
        Created: 'DATETIME',
        CreatedBy: 'INTEGER',
        Modified: 'DATETIME',
        ModifiedBy: 'INTEGER',
    };

    systemFields?.forEach(df => {
        colTypeMap[df.Name] = df.DataType.toUpperCase();
    });
    domainFields?.forEach(df => {
        if (df.dataType.name !== CALCULATED_TYPE.name && df.dataType.name !== MULTI_CHOICE_TYPE.name) {
            colTypeMap[df.name] = df.dataType.name.toLowerCase() === 'int' ? 'INTEGER' : df.dataType.name.toUpperCase();
        }
    });
    return colTypeMap;
};

export const getPHIColumnNames = (domainFields: DomainField[]): string[] => {
    if (!domainFields) return [];
    return domainFields.filter(df => df.isPHI()).map(df => df.name);
};

const HELP_TIP_BODY = (
    <div className="domain-field-fixed-tooltip">
        <p>Define the SQL expression to use for this calculated field.</p>
        <p>
            The expression must be valid LabKey SQL and can use the default system fields, custom fields, constants, and
            operators. Learn more about using{' '}
            <HelpLink topic={LABKEY_SQL_TOPIC} useDefaultUrl>
                LabKey SQL
            </HelpLink>
            .
        </p>
    </div>
);

export interface CalculatedFieldOptionsProps {
    domainIndex: number;
    field: DomainField;
    getDomainFields: GetDomainFields;
    index: number;
    onChange: (fieldId: string, value: any, index?: number, expand?: boolean, skipDirtyCheck?: boolean) => void;
}

export const CalculatedFieldOptions: FC<CalculatedFieldOptionsProps> = memo(props => {
    const { index, field, domainIndex, onChange, getDomainFields } = props;
    const [loading, setLoading] = useState<boolean>(!field.isNew());
    const [error, setError] = useState<string>(undefined);
    const [parsedType, setParsedType] = useState<string>(undefined);
    const { close, open, show } = useModalState();
    const isNew = useMemo(() => field.isNew(), [field]);
    const { headingId, inputId } = useMemo(
        () => ({
            headingId: `expression-label-${domainIndex}-${index}`,
            inputId: createFormInputId(DOMAIN_FIELD_VALUE_EXPRESSION, domainIndex, index),
        }),
        [domainIndex, index]
    );
    const { api } = useAppContext();
    const assistanceEnabled = useServerContext().mcpReady === true;

    const handleChange = useCallback<React.ChangeEventHandler<HTMLTextAreaElement>>(
        evt => {
            onChange(evt.target.id, evt.target.value);
            setError(undefined);
            setParsedType(undefined);
        },
        [onChange]
    );

    const validateExpression = useCallback(
        async (expression: string, isExpressionChange = true): Promise<void> => {
            setLoading(true);
            setError(undefined);
            setParsedType(undefined);
            const { domainFields, systemFields } = getDomainFields();
            try {
                const response = await api.domain.parseCalculatedColumn(
                    expression,
                    domainFields.toArray(),
                    systemFields
                );
                setError(response.error);
                setParsedType(response.type);

                const warningId = createFormInputId(DOMAIN_FIELD_CLIENT_SIDE_ERROR, domainIndex, index);
                if (response.error) {
                    const domainFieldWarning = new DomainFieldError({
                        message: 'Field expression is invalid.',
                        fieldName: field.name,
                        propertyId: undefined,
                        severity: SEVERITY_LEVEL_WARN,
                        rowIndexes: List<number>([index]),
                    });
                    onChange(warningId, domainFieldWarning, index, false, true);
                } else if (isExpressionChange) {
                    onChange(warningId, undefined, index, false, true);
                }
            } catch (e) {
                setError(resolveErrorMessage(e) ?? 'Failed to validate expression.');
            } finally {
                setLoading(false);
            }
        },
        [api, domainIndex, field.name, getDomainFields, index, onChange]
    );

    const handleBlur = useCallback<React.FocusEventHandler<HTMLTextAreaElement>>(
        evt => {
            validateExpression(evt.target.value, true);
        },
        [validateExpression]
    );

    const handleApplyExpression = useCallback(
        (analysis: string) => {
            onChange(inputId, analysis);
            setError(undefined);
            setParsedType(undefined);
            validateExpression(analysis, true);
            incrementClientSideMetricCount(EXPR_ASST_METRIC_FEATURE_AREA, 'applyExpression');
        },
        [inputId, onChange, validateExpression]
    );

    const onOpenAssistant = useCallback(() => {
        open();
        incrementClientSideMetricCount(EXPR_ASST_METRIC_FEATURE_AREA, 'clickButton');
    }, [open]);

    const onValidateAssistant = useCallback(() => {
        open();
        incrementClientSideMetricCount(EXPR_ASST_METRIC_FEATURE_AREA, 'clickHelpWithValidate');
    }, [open]);

    useEffect(() => {
        if (!isNew) {
            validateExpression(field.valueExpression, false);
        }
    }, []); //eslint-disable-line react-hooks/exhaustive-deps -- on mount only

    return (
        <div
            className={classNames({
                'margin-bottom': !!field?.rangeURI && !PropDescType.isString(field.rangeURI),
            })}
        >
            <div className="row">
                <div className="col-xs-12">
                    <SectionHeading
                        cls="bottom-padding"
                        helpTipBody={HELP_TIP_BODY}
                        id={headingId}
                        title="Expression"
                    />
                </div>
                <div className="col-xs-12 col-md-7">
                    <textarea
                        aria-labelledby={headingId}
                        className="form-control"
                        disabled={
                            isFieldPartiallyLocked(field.lockType) ||
                            isFieldFullyLocked(field.lockType) ||
                            field.lockExistingField
                        }
                        id={inputId}
                        name={createFormInputName(DOMAIN_FIELD_VALUE_EXPRESSION)}
                        onBlur={handleBlur}
                        onChange={handleChange}
                        rows={6}
                        value={field.valueExpression || ''}
                    />
                    <div className="domain-field-calc-footer">
                        {error && (
                            <div>
                                <span className="error">{error}</span>
                                {assistanceEnabled && (
                                    <button
                                        className="clickable-text validate-link-ai"
                                        onClick={onValidateAssistant}
                                        type="button"
                                    >
                                        Get help from AI
                                    </button>
                                )}
                            </div>
                        )}
                        {!error && parsedType && (
                            <div className="validated">
                                Validated. Calculated data type is "{typeToDisplay(parsedType)}".
                            </div>
                        )}
                        {loading && <div>Validating expression...</div>}
                        {!error && !loading && !parsedType && field.valueExpression?.length > 0 && (
                            <div className="validate-link">Click to validate</div>
                        )}
                    </div>
                </div>
                {assistanceEnabled && (
                    <div className="col-xs-12 col-md-5">
                        <div className="margin-bottom">
                            The AI Assistant can help you create or validate an expression. You can describe the
                            calculation you want, or get help with an existing expression.
                        </div>
                        <div className="margin-bottom">
                            <button className="btn btn-default" onClick={onOpenAssistant} type="button">
                                <SVGIcon
                                    height="16px"
                                    iconSrc="ai_stars_icon"
                                    style={{ marginRight: '4px', marginTop: '-4px' }}
                                    width="16px"
                                />
                                AI Assistant
                            </button>
                        </div>
                        <HelpLink topic={FIELD_EDITOR_CALC_COLS_TOPIC}>See calculation examples</HelpLink>
                    </div>
                )}
                {!assistanceEnabled && (
                    <div className="col-xs-12 col-md-5 domain-field-calc-examples">
                        <table>
                            <tbody>
                                <tr>
                                    <td>Examples:</td>
                                </tr>
                                <tr>
                                    <td>Addition:</td>
                                    <td className="code">numericField1 + numericField2</td>
                                </tr>
                                <tr>
                                    <td>Subtraction:</td>
                                    <td className="code">numericField1 - numericField2</td>
                                </tr>
                                <tr>
                                    <td>Multiplication:</td>
                                    <td className="code">numericField1 * numericField2</td>
                                </tr>
                                <tr>
                                    <td>Division:</td>
                                    <td className="code">numericField1 / nonZeroField1</td>
                                </tr>
                            </tbody>
                        </table>
                        <HelpLink topic={FIELD_EDITOR_CALC_COLS_TOPIC}>Click for more examples</HelpLink>
                    </div>
                )}
            </div>
            {show && (
                <ExpressionAssistantModal
                    // Only inform the modal of the error if there is an invalid expression
                    fieldError={field.valueExpression ? error : undefined}
                    fieldExpression={field.valueExpression}
                    getDomainFields={getDomainFields}
                    onApplyExpression={handleApplyExpression}
                    onCancel={close}
                />
            )}
        </div>
    );
});
CalculatedFieldOptions.displayName = 'CalculatedFieldOptions';
