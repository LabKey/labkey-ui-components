import { List, Map } from 'immutable';
import { Utils } from '@labkey/api';

import { QueryInfo } from '../../../..';

function arrayListIsEqual(valueArr: Array<string | number>, nestedModelList: List<Map<string, any>>): boolean {
    let matched = 0;
    // Loop through the submitted array and the existing list and compare values.
    // If values match, add tally. If submitted values length is same as existing list, consider them equal.
    // Note: caller should have checked against empty array and list before function.
    nestedModelList.forEach(nestedField => {
        return valueArr.forEach(nestedVal => {
            if (nestedField.get('value') === nestedVal || nestedField.get('displayValue') === nestedVal) {
                matched++;
            }
        });
    });

    return matched === valueArr.length;
}

export function extractChanges(
    queryInfo: QueryInfo,
    currentData: Map<string, any>,
    formValues: Record<string, any>
): Record<string, any> {
    const changedValues = {};
    // Loop through submitted formValues and check against existing currentData from server
    Object.keys(formValues).forEach(field => {
        // If nested value, will need to do deeper check
        if (List.isList(currentData.get(field))) {
            // If the submitted value and existing value are empty, do not update field
            if (!formValues[field] && currentData.get(field).size === 0) {
                return false;
            }
            // If the submitted value is empty and there is an existing value, should update field
            else if (!formValues[field] && currentData.get(field).size > 0) {
                changedValues[field] = formValues[field];
            } else {
                // If submitted value array and existing value array are different size, should update field
                if (formValues[field].length !== currentData.get(field).size) {
                    changedValues[field] = formValues[field];
                }
                // If submitted value array and existing array are the same size, need to compare full contents
                else if (formValues[field].length === currentData.get(field).size) {
                    if (!arrayListIsEqual(formValues[field], currentData.get(field))) {
                        changedValues[field] = formValues[field];
                    }
                }
            }
        } else if (formValues[field] != currentData.getIn([field, 'value'])) {
            const column = queryInfo.getColumn(field);

            // A date field needs to be checked specially
            if (column && column.jsonType === 'date') {
                // Ensure dates have same formatting
                const newDateStr = formValues[field];
                const newDate = new Date(newDateStr);
                const origDate = new Date(currentData.getIn([field, 'value']));
                // If submitted value is same as existing date down to the minute (issue 40139), do not update
                let newDateValue = newDate.setUTCSeconds(0, 0);
                let origDateValue = origDate.setUTCSeconds(0, 0);
                // If original date doesn't have timestamp, then only check date to hour
                if (Utils.isString(newDateStr) && newDateStr.indexOf(':') === -1) {
                    newDateValue = newDate.setUTCHours(0, 0, 0, 0);
                    origDateValue = origDate.setUTCHours(0, 0, 0, 0);
                }

                if (newDateValue === origDateValue) {
                    return false;
                }
            }

            changedValues[field] = formValues[field];
        }
    });

    return changedValues;
}
