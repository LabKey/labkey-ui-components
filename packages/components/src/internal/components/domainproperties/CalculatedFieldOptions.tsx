import React, {FC, memo, useCallback, useEffect, useMemo, useState} from 'react';
import classNames from 'classnames';

import { List } from 'immutable';

import { FIELD_EDITOR_CALC_COLS_TOPIC, HelpLink, LABKEY_SQL_TOPIC } from '../../util/helpLinks';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { createFormInputId, createFormInputName } from './utils';
import { DOMAIN_FIELD_VALUE_EXPRESSION } from './constants';
import {DomainField, SystemField} from './models';
import { SectionHeading } from './SectionHeading';
import { isFieldFullyLocked, isFieldPartiallyLocked } from './propertiesUtil';
import {CALCULATED_TYPE, PropDescType} from './PropDescType';
import { parseCalculatedColumn } from './actions';

const typeToDisplay = (type: string): string => {
    if (type.toLowerCase() === 'other') {
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

const getColumnTypeMap = (domainFields: List<DomainField>, systemFields: SystemField[]): Record<string, string> => {
    const colTypeMap = {};
    systemFields.forEach(df => {
        colTypeMap[df.Name] = df.DataType.toUpperCase();
    });
    domainFields.forEach(df => {
        if (df.dataType.name !== CALCULATED_TYPE.name) {
            colTypeMap[df.name] = df.dataType.name === 'int' ? 'INTEGER' : df.dataType.name.toUpperCase();
        }
    });
    return colTypeMap;
};

const HELP_TIP_BODY = (
    <div className="domain-field-fixed-tooltip">
        <p>Define the SQL expression to use for this calculated field.</p>
        <p>
            The expression must be valid LabKey SQL and can use the default system fields, custom fields, constants, and
            operators. Learn more: <HelpLink topic={LABKEY_SQL_TOPIC}>LabKey SQL Reference</HelpLink>
        </p>
        Examples:
        <pre>
            <p>numericField1 / numericField2 * 100</p>
            <p>CURDATE()</p>
            <p>CASE WHEN FreezeThawCount &lt; 2 THEN 'Viable' ELSE 'Questionable' END</p>
        </pre>
        <HelpLink topic={FIELD_EDITOR_CALC_COLS_TOPIC}>Click for more examples</HelpLink>
    </div>
);

interface Props {
    domainIndex: number;
    field: DomainField;
    getDomainFields: () => { domainFields: List<DomainField>, systemFields: SystemField[] };
    index: number;
    onChange: (string, any) => void;
}

export const CalculatedFieldOptions: FC<Props> = memo(props => {
    const { index, field, domainIndex, onChange, getDomainFields } = props;
    const [error, setError] = useState<string>(undefined);
    const [parsedType, setParsedType] = useState<string>(undefined);
    const isNew = useMemo(() => field.isNew(), [field]);

    const handleChange = useCallback(
        (evt: any): void => {
            onChange(evt.target.id, evt.target.value);
        },
        [onChange]
    );

    const validateExpression = useCallback(
        async (value: string): Promise<void> => {
            setError(undefined);
            setParsedType(undefined);
            const { domainFields, systemFields } = getDomainFields();
            const colTypeMap = getColumnTypeMap(domainFields, systemFields);
            const response = await parseCalculatedColumn(value, colTypeMap);
            setError(response.error);
            setParsedType(response.type);
        },
        [getDomainFields]
    );

    const handleBlur = useCallback(
        (evt: any): void => {
            const value = evt.target.value;
            validateExpression(value);
        },
        [validateExpression]
    );

    useEffect(
        () => {
            if (!isNew) {
                validateExpression(field.valueExpression);
            }
        },
        [
            /* on mount only */
        ]
    );

    return (
        <div
            className={classNames({
                'margin-bottom': !!field?.rangeURI && !PropDescType.isString(field.rangeURI),
            })}
        >
            <div className="row">
                <div className="col-xs-12">
                    <SectionHeading title="Expression" cls="bottom-spacing" helpTipBody={HELP_TIP_BODY} />
                </div>
            </div>
            <div className="row">
                <div className="col-xs-12">
                    <textarea
                        className="form-control"
                        rows={4}
                        value={field.valueExpression || ''}
                        id={createFormInputId(DOMAIN_FIELD_VALUE_EXPRESSION, domainIndex, index)}
                        name={createFormInputName(DOMAIN_FIELD_VALUE_EXPRESSION)}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={isFieldPartiallyLocked(field.lockType) || isFieldFullyLocked(field.lockType)}
                    />
                    <div className="domain-field-calc-footer">
                        {error && <div className="error">{error}</div>}
                        {!error && parsedType && <div className="validated">Validated. Calculated data type is "{typeToDisplay(parsedType)}".</div>}
                        {!isNew && !error && !parsedType && <LoadingSpinner msg="Validating expression..." />}
                    </div>
                </div>
            </div>
        </div>
    );
});
