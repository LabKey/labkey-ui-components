import React, { FC, memo, useEffect, useState } from 'react';

import { Query } from "@labkey/api";

import { naturalSort } from "../../../public/sort";
import { Alert } from "../base/Alert";
import { resolveErrorMessage } from "../../util/messaging";
import { LoadingSpinner } from "../base/LoadingSpinner";

interface Props {
    selectDistinctOptions: Query.SelectDistinctOptions
}

export const FilterFacetedSelector: FC<Props> = memo(props => {
    const { selectDistinctOptions } = props;

    const [activeFieldDistinctValues, setActiveFieldDistinctValues] = useState<any[]>(undefined);
    const [error, setError] = useState<string>(undefined);

    useEffect(() => {
        Query.selectDistinctRows({
            ...selectDistinctOptions,
            success: result => {
                const distinctValues = result.values.sort(naturalSort);
                setActiveFieldDistinctValues(distinctValues);
            },
            failure: error => {
                console.error(error);
                setError(resolveErrorMessage(error));
            }
        });
    }, [activeFieldDistinctValues, selectDistinctOptions]);

    return (
        <>
            {error && <Alert>{error}</Alert>}
            {!activeFieldDistinctValues && <LoadingSpinner/>}
            <div className="list-group search-parent-entity-col">
                <ul className="nav nav-stacked labkey-wizard-pills">
                    {activeFieldDistinctValues?.map((value, index) => {
                        let displayValue = value;
                        if (value === null || value === undefined)
                            displayValue = '[blank]';
                        if (value === true)
                            displayValue = 'TRUE';
                        if (value === false)
                            displayValue = 'FALSE';
                        return (
                            <li key={index}>
                                <div className="form-check">
                                    <input className="form-check-input"
                                           type="checkbox"
                                           name={'field-value-' + index}
                                           disabled={true}
                                           checked={false}/>
                                    <span style={{marginLeft: 5}}>{displayValue}</span>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </>
    );
});

