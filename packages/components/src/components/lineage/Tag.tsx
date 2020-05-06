/*
 * Copyright (c) 2016-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { List, Map } from 'immutable';
import { Button } from 'react-bootstrap';

import { AppURL, GridColumn } from '../..';

import { DEFAULT_LINEAGE_DISTANCE } from './constants';
import { LINEAGE_DIRECTIONS } from './types';

interface TagProps {
    bsStyle?: string;
    showOnHover?: boolean;
}

export const Tag: React.FunctionComponent<TagProps> = props => (
    <span className={'pull-right ' + (props.showOnHover === false ? 'hide-on-hover' : 'show-on-hover')}>
        <span className={'label ' + (props.bsStyle ? `label-${props.bsStyle}` : '')}>{props.children}</span>
    </span>
);

export const LINEAGE_GRID_COLUMNS = List([
    new GridColumn({
        index: 'name',
        title: 'Name',
        width: 270,
        cell: (name: string, node: Map<string, any>) => {
            const indent = node.get('distance') * 10;
            const dupeCount = node.get('duplicateCount');
            const isParents = node.get('membersShown') === LINEAGE_DIRECTIONS.Parent;
            const nodeDistance = node.get('distance');
            const links = node.get('links');

            return (
                <div
                    className="lineage-name"
                    style={{ textIndent: indent + 'px' }}
                    title={dupeCount > 0 ? dupeCount + ' duplicates' : ''}
                >
                    {links.overview ? <a href={links.overview}>{name}</a> : name}
                    {nodeDistance === 0 && <Tag bsStyle="success">Seed</Tag>}
                    {nodeDistance === 1 && <Tag bsStyle="info">1st {isParents ? 'parent' : 'child'}</Tag>}
                    {nodeDistance === 2 && <Tag bsStyle="primary">2nd {isParents ? 'parent' : 'child'}</Tag>}
                    {dupeCount > 0 && (
                        <Tag bsStyle="warning" showOnHover={false}>
                            Duplicate
                        </Tag>
                    )}
                </div>
            );
        },
    }),
    new GridColumn({
        index: 'distance',
        title: 'Distance',
        width: 60,
        cell: (distance: any, node: Map<string, any>) => {
            const gen = distance > 1 ? ' generations' : ' generation';

            return distance === 0 ? (
                distance
            ) : node.get('membersShown') === LINEAGE_DIRECTIONS.Parent ? (
                <span title={distance + gen + ' above seed'}>{distance}</span>
            ) : (
                <span title={distance + gen + ' below seed'}>{distance}</span>
            );
        },
    }),
    new GridColumn({
        index: 'lsid',
        title: 'Change Seed',
        width: 70,
        cell: (lsid: string, node: Map<string, any>) => {
            const lineageDistance = node.get('lineageDistance');
            const baseURL = AppURL.create('lineage').addParams({
                seeds: lsid,
                distance: lineageDistance ? lineageDistance : DEFAULT_LINEAGE_DISTANCE,
            });
            const parentUrl = baseURL.addParam('members', LINEAGE_DIRECTIONS.Parent);
            const childrenUrl = baseURL.addParam('members', LINEAGE_DIRECTIONS.Children);
            const children = node.get('children');
            const parents = node.get('parents');
            const membersShown = node.get('membersShown');
            const nodeDistance = node.get('distance');

            return (
                <div className="text-nowrap">
                    {parents.size > 0 ? (
                        membersShown === LINEAGE_DIRECTIONS.Parent && nodeDistance === 0 ? (
                            <Button bsSize="xs" bsStyle="primary" className="lineage-btn-seed" disabled>
                                <span className="fa fa-arrow-up" />
                            </Button>
                        ) : (
                            <Button
                                bsSize="xs"
                                bsStyle="primary"
                                className="lineage-btn-seed"
                                href={parentUrl.toHref()}
                                title={'Parents for ' + node.get('name')}
                            >
                                <span className="fa fa-arrow-up" />
                            </Button>
                        )
                    ) : (
                        <Button bsSize="xs" bsStyle="primary" className="lineage-btn-seed" disabled>
                            <span className="fa fa-arrow-up" />
                        </Button>
                    )}
                    <span style={{ paddingRight: '5px' }}>&nbsp;</span>
                    {children.size > 0 ? (
                        membersShown === LINEAGE_DIRECTIONS.Children && nodeDistance === 0 ? (
                            <Button bsSize="xs" bsStyle="primary" className="lineage-btn-seed" disabled>
                                <span className="fa fa-arrow-down" />
                            </Button>
                        ) : (
                            <Button
                                bsSize="xs"
                                bsStyle="primary"
                                className="lineage-btn-seed"
                                href={childrenUrl.toHref()}
                                title={'Children for ' + node.get('name')}
                            >
                                <span className="fa fa-arrow-down" />
                            </Button>
                        )
                    ) : (
                        <Button bsSize="xs" bsStyle="primary" className="lineage-btn-seed" disabled>
                            <span className="fa fa-arrow-down" />
                        </Button>
                    )}
                </div>
            );
        },
    }),
    new GridColumn({
        index: 'displayType',
        title: 'Type',
    }),
    new GridColumn({
        index: 'date',
        title: 'Creation Date',
    }),
    new GridColumn({
        index: 'description',
        title: 'Description',
    }),
    new GridColumn({
        index: 'label',
        title: 'Alias',
    }),
]);
