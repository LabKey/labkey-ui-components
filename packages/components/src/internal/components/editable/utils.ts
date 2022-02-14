import {fromJS, List, Map, Set} from "immutable";
import {Utils} from "@labkey/api";

import {QueryModel} from "../../../public/QueryModel/QueryModel";
import {EditorModel, ValueDescriptor} from "../../models";
import {genCellKey, getLookupValueDescriptors} from "../../actions";

export const loadEditorModelData = async (queryModelData: Partial<QueryModel>): Promise<Partial<EditorModel>> => {
    const { orderedRows, rows, queryInfo } = queryModelData;
    const columns = queryInfo.getInsertColumns();
    const lookupValueDescriptors = await getLookupValueDescriptors(
        columns.toArray(),
        fromJS(rows),
        fromJS(orderedRows)
    );
    let cellValues = Map<string, List<ValueDescriptor>>();

    // data is initialized in column order
    columns.forEach((col, cn) => {
        orderedRows.forEach((id, rn) => {
            const row = rows[id];
            const cellKey = genCellKey(cn, rn);
            const value = row[col.fieldKey];

            if (Array.isArray(value)) {
                // assume to be list of {displayValue, value} objects
                cellValues = cellValues.set(
                    cellKey,
                    value.reduce(
                        (list, v) => list.push({ display: v.displayValue, raw: v.value }),
                        List<ValueDescriptor>()
                    )
                );
            } else {
                // assume to be a {displayValue, value} object
                const raw = value?.value;
                const display = value?.displayValue ?? raw;
                let cellValue = List([{
                    display: display !== null ? display : undefined,
                    raw: raw !== null ? raw : undefined
                }]);

                // Issue 37833: try resolving the value for the lookup to get the displayValue to show in the grid cell
                if (col.isLookup() && Utils.isNumber(raw)) {
                    const descriptors = lookupValueDescriptors[col.lookupKey];
                    if (descriptors) {
                        cellValue = List(descriptors.filter(descriptor => descriptor.raw === raw));
                    }
                }

                cellValues = cellValues.set(cellKey, cellValue);
            }
        });
    });

    return {
        cellValues,
        colCount: columns.size,
        deletedIds: Set<any>(),
        rowCount: orderedRows.length,
    };
}
