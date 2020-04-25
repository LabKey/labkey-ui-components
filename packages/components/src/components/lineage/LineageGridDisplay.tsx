/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { Component, PureComponent } from 'react';
import { List, Map } from 'immutable';
import { Button } from 'react-bootstrap';

import { Alert, AppURL, getLocation, Grid, GridProps } from '../..';

import { LineageGridModel } from './models';
import { DEFAULT_LINEAGE_DISTANCE } from './constants';
import { LINEAGE_DIRECTIONS } from './types';
import { getPageNumberChangeURL } from './actions';

interface LineagePagingProps {
    model: LineageGridModel;
}

export class LineagePaging extends Component<LineagePagingProps> {
    shouldComponentUpdate(nextProps: LineagePagingProps) {
        const { model } = this.props;
        const nextModel = nextProps.model;

        return !(
            model.totalRows === nextModel.totalRows &&
            model.getMinRowIndex() === nextModel.getMinRowIndex() &&
            model.getMaxRowIndex() === nextModel.getMaxRowIndex()
        );
    }

    render() {
        const { model } = this.props;
        const min = model.getMinRowIndex();
        const max = model.getMaxRowIndex();
        const total = model.totalRows;
        const location = getLocation();

        // hidden when "0 of 0" or "1 - N of N"
        const showButtons = !(max === 0 || (min === 1 && max === total));

        return (
            <div className="col-xs-12">
                <div className="paging pull-right text-nowrap">
                    {total !== 0 && (
                        <span
                            className={showButtons ? 'paging-counts-with-buttons' : 'paging-counts-without-buttons'}
                            data-min={min}
                            data-max={max}
                            data-total={total}
                        >
                            {min === max ? (
                                <span>{max}</span>
                            ) : (
                                <span>
                                    {max === 0 ? 0 : min}&nbsp;-&nbsp;{max}
                                </span>
                            )}{' '}
                            of {total}
                        </span>
                    )}
                    {showButtons && (
                        <div className="btn-group">
                            <Button
                                href={getPageNumberChangeURL(
                                    location,
                                    model.seedNode.lsid,
                                    model.pageNumber - 1
                                ).toHref()}
                                disabled={model.pageNumber <= 1}
                            >
                                <i className="fa fa-chevron-left" />
                            </Button>
                            <Button
                                href={getPageNumberChangeURL(
                                    location,
                                    model.seedNode.lsid,
                                    model.pageNumber + 1
                                ).toHref()}
                                disabled={max === total}
                            >
                                <i className="fa fa-chevron-right" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

interface LineageGridProps {
    model: LineageGridModel;
}

class LineageButtons extends PureComponent<LineageGridProps> {
    render() {
        const { model } = this.props;
        const location = getLocation();
        const members = location.query.get('members');
        const distance = location.query.get('distance');

        let disableParents = members === LINEAGE_DIRECTIONS.Parent;
        let disableChildren = members === LINEAGE_DIRECTIONS.Children || members === undefined;

        if (model.seedNode) {
            disableParents =
                disableParents || !model.seedNode.get('parents') || model.seedNode.get('parents').size === 0;
            disableChildren =
                disableChildren || !model.seedNode.get('children') || model.seedNode.get('children').size === 0;

            const baseURL = AppURL.create('lineage').addParams({
                seeds: model.seedNode.lsid,
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
                    <Button bsStyle="success" href={parentNodesURL.toHref()} disabled={disableParents}>
                        Show Parents
                    </Button>
                    <span style={{ margin: '0 10px' }}>
                        <Button bsStyle="success" href={childrenNodesURL.toHref()} disabled={disableChildren}>
                            Show Children
                        </Button>
                    </span>
                </div>
            );
        }

        return null;
    }
}

class LineageGridBar extends PureComponent<LineageGridProps> {
    render() {
        const { model } = this.props;

        if (model.seedNode) {
            return (
                <div className="row bottom-spacing">
                    <div className="col-sm-4">
                        <LineageButtons {...this.props} />
                    </div>
                    <div className="text-center col-sm-4 lineage-seed-info">
                        Showing {model.members} from seed:
                        <span className="lineage-seed-name">{model.seedNode.get('name')}</span>
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
            .slice(model.getOffset(), model.getMaxRowIndex())
            .map(d =>
                d
                    .toMap()
                    .merge({
                        membersShown: model.members, // added so we can determine which lineage links to disable in the seed rows
                        lineageDistance: model.distance, // added so we can create lineage links with the same distance as the current page
                        duplicateCount: model.nodeCounts.get(d.get('lsid')) - 1,
                    })
                    // also merge the row's meta properties up so they can be shown in the grid columns
                    .merge(d.get('meta'))
            )
            .toList();
    }

    render() {
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
            <>
                <LineageGridBar {...this.props} />

                {/* Grid row */}
                <div className="row">
                    <div className="col-md-12">
                        <Grid {...gridProps} />
                    </div>
                </div>
            </>
        );
    }
}
