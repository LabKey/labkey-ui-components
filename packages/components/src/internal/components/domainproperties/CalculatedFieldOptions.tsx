import React, { FC, memo, PureComponent, ReactNode, useCallback } from 'react';
import classNames from 'classnames';

import { HelpLink, LABKEY_SQL_TOPIC } from '../../util/helpLinks';

import { createFormInputId, createFormInputName } from './utils';
import { DOMAIN_FIELD_VALUE_EXPRESSION } from './constants';
import { DomainField } from './models';
import { SectionHeading } from './SectionHeading';
import { isFieldFullyLocked, isFieldPartiallyLocked } from './propertiesUtil';
import { PropDescType } from './PropDescType';

const HELP_TIP_BODY = (
    <>
        <p>
            Define the SQL expression to use for this calculated field. This definition can perform some type of
            calculation for the given data row.
        </p>
        <p>
            The expression must be valid LabKey SQL and can use the default system fields, custom fields, and SQL
            functions as defined in the <HelpLink topic={LABKEY_SQL_TOPIC}>LabKey SQL Reference</HelpLink>{' '}
            documentation.
        </p>
        <p>
            Examples:
            <ul>
                <li>
                    <code>numericField1 / numericField2 * 100</code>
                </li>
                <li>
                    <code>CURDATE()</code>
                </li>
                <li>
                    <code>TIMESTAMPDIFF( 'SQL_TSI_DAY', CURDATE(), TIMESTAMPADD( 'SQL_TSI_MONTH', 6, dateField))</code>
                </li>
                <li>
                    <code>
                        CASE WHEN age_in_months(dateField, CURDATE()) &lt;= 6 AND FreezeThawCount &lt; 2 THEN 'Viable'
                        ELSE 'Questionable' END
                    </code>
                </li>
            </ul>
        </p>
    </>
);

interface Props {
    domainIndex: number;
    field: DomainField;
    index: number;
    onChange: (string, any) => void;
}

export const CalculatedFieldOptions: FC<Props> = memo(props => {
    const { index, field, domainIndex, onChange } = props;

    const handleChange = useCallback(
        (evt: any): void => {
            onChange(evt.target.id, evt.target.value);
        },
        [onChange]
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
                        disabled={isFieldPartiallyLocked(field.lockType) || isFieldFullyLocked(field.lockType)}
                    />
                </div>
            </div>
        </div>
    );
});
