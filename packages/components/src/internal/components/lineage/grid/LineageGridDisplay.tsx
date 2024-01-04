/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, PureComponent, ReactNode, useMemo } from 'react';
import { List, Map } from 'immutable';
import { useSearchParams } from 'react-router-dom';

import { getQueryParams } from '../../../util/URL';

import { LineageGridModel } from '../models';
import { DEFAULT_LINEAGE_DISTANCE } from '../constants';
import { LINEAGE_DIRECTIONS } from '../types';
import { getPageNumberChangeURL } from '../actions';
import { LineageDepthLimitMessage } from '../LineageGraph';
import { AppURL } from '../../../url/AppURL';
import { Alert } from '../../base/Alert';
import { Grid, GridProps } from '../../base/Grid';
import { DisableableAnchor } from '../../base/DisableableAnchor';

interface LineagePagingProps {
    model: LineageGridModel;
}

export const LineagePaging: FC<LineagePagingProps> = memo(({ model }) => {
    const [searchParams] = useSearchParams();
    const { maxRowIndex, minRowIndex, pageNumber, seedNode, totalRows } = model;

    // hidden when "0 of 0" or "1 - N of N"
    const showButtons = !(maxRowIndex === 0 || (minRowIndex === 1 && maxRowIndex === totalRows));
    const queryParams = useMemo(() => getQueryParams(searchParams), [searchParams]);

    return (
        <div className="col-xs-12">
            <div className="paging pull-right text-nowrap">
                {totalRows !== 0 && (
                    <span
                        className={showButtons ? 'paging-counts-with-buttons' : 'paging-counts-without-buttons'}
                        data-max={maxRowIndex}
                        data-min={minRowIndex}
                        data-total={totalRows}
                    >
                        {minRowIndex === maxRowIndex ? (
                            <span>{maxRowIndex}</span>
                        ) : (
                            <span>
                                {maxRowIndex === 0 ? 0 : minRowIndex}&nbsp;-&nbsp;{maxRowIndex}
                            </span>
                        )}{' '}
                        of {totalRows}
                    </span>
                )}
                {showButtons && (
                    <div className="btn-group">
                        <DisableableAnchor
                            className="btn btn-default"
                            disabled={pageNumber <= 1}
                            href={getPageNumberChangeURL(queryParams, seedNode.lsid, pageNumber - 1).toHref()}
                        >
                            <i className="fa fa-chevron-left" />
                        </DisableableAnchor>
                        <DisableableAnchor
                            className="btn btn-default"
                            disabled={maxRowIndex === totalRows}
                            href={getPageNumberChangeURL(queryParams, seedNode.lsid, pageNumber + 1).toHref()}
                        >
                            <i className="fa fa-chevron-right" />
                        </DisableableAnchor>
                    </div>
                )}
            </div>
        </div>
    );
});

interface LineageGridProps {
    model: LineageGridModel;
}

class LineageButtons extends PureComponent<LineageGridProps> {
    render(): ReactNode {
        const { distance, members, seedNode } = this.props.model;

        if (seedNode) {
            const disableParents = members === LINEAGE_DIRECTIONS.Parent || seedNode.parents.size === 0;
            const disableChildren =
                members === LINEAGE_DIRECTIONS.Children || members === undefined || seedNode.children.size === 0;

            const baseURL = AppURL.create('lineage').addParams({
                seeds: seedNode.lsid,
                distance: distance ? distance : DEFAULT_LINEAGE_DISTANCE,
            });

            const parentNodesURL = baseURL.addParams({
                members: LINEAGE_DIRECTIONS.Parent,
            });

            const childrenNodesURL = baseURL.addParams({
                members: LINEAGE_DIRECTIONS.Children,
            });

            return (
                <div className="text-nowrap">
                    <DisableableAnchor
                        className="btn btn-success"
                        disabled={disableParents}
                        href={parentNodesURL.toHref()}
                    >
                        Show Parents
                    </DisableableAnchor>
                    <span style={{ margin: '0 10px' }}>
                        <DisableableAnchor
                            className="btn btn-success"
                            disabled={disableChildren}
                            href={childrenNodesURL.toHref()}
                        >
                            Show Children
                        </DisableableAnchor>
                    </span>
                </div>
            );
        }

        return null;
    }
}

export class LineageGridBar extends PureComponent<LineageGridProps> {
    render(): ReactNode {
        const { model } = this.props;

        if (model.seedNode) {
            return (
                <div className="row bottom-spacing">
                    <div className="col-sm-4">
                        <LineageButtons model={model} />
                    </div>
                    <div className="text-center col-sm-4 lineage-seed-info">
                        Showing {model.members} from seed:
                        <span className="lineage-seed-name">{model.seedNode.name}</span>
                    </div>
                    <div className="col-sm-4">
                        <LineagePaging model={model} />
                    </div>
                </div>
            );
        }

        return null;
    }
}

export class LineageGridDisplay extends PureComponent<LineageGridProps> {
    getDataForPage(): List<Map<string, any>> {
        const { model } = this.props;

        return model.data
            .slice(model.offset, model.maxRowIndex)
            .map(node =>
                node
                    .toMap()
                    .merge({
                        membersShown: model.members, // added so we can determine which lineage links to disable in the seed rows
                        lineageDistance: model.distance, // added so we can create lineage links with the same distance as the current page
                        duplicateCount: model.nodeCounts.get(node.lsid) - 1,
                    })
                    // also merge the row's meta properties up so they can be shown in the grid columns
                    .merge(node.meta)
            )
            .toList();
    }

    render(): ReactNode {
        const { model } = this.props;

        if (model.isError) {
            return <Alert>{model.message ? model.message : 'Something went wrong.'}</Alert>;
        }

        const gridProps: GridProps = {
            calcWidths: true,
            columns: model.columns,
            condensed: true,
            isLoading: model.isLoading,
        };

        if (!model.isLoading) {
            gridProps.data = this.getDataForPage();
        }

        return (
            <div className="lineage-grid-display">
                <LineageGridBar model={model} />

                {/* Grid row */}
                <div className="row">
                    <div className="col-md-12">
                        <Grid {...gridProps} />
                    </div>
                </div>
                <LineageDepthLimitMessage
                    className="lineage-grid-generation-limit-msg"
                    maxDistance={model.distance}
                    nodeName={model.seedNode?.name}
                />
            </div>
        );
    }
}
