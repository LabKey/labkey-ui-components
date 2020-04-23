/*
 * Copyright (c) 2017-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { Component } from 'react';
import { DataSet, Edge, IdType, Network, Node } from 'vis-network';

import { LineageNode } from '../models';

import { isCombinedNode, VisGraphCombinedNode, VisGraphNodeType, VisGraphOptions } from './VisGraphGenerator';
import { VisGraphControls } from './VisGraphControls';

export type HoverNodeCoords = { top: number; left: number; bottom: number; right: number };

// Directly from https://github.com/visjs/vis-network/blob/v6.5.2/lib/network/shapes.ts#L9
/**
 * Draw a circle.
 *
 * @param ctx - The context this shape will be rendered to.
 * @param x - The position of the center on the x axis.
 * @param y - The position of the center on the y axis.
 * @param r - The radius of the circle.
 */
function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI, false);
    ctx.closePath();
}

// defined in vis/lib/network/shapes.js
interface InternalVisNetwork extends Network {
    body: {
        container: HTMLElement;
        nodes: { [key: string]: InternalVisNode };
        nodeIndices: IdType[];
    };
    layoutEngine: {
        _centerParent: (node: InternalVisNode) => void;
    };
}

// defined in vis/lib/network/modules/components/Node.js
interface InternalVisNode {
    options: Node;
    id: string;
    shape: {
        top: number;
        left: number;
        width: number;
        height: number;
        radius: number;
    };
    hover: boolean;
    x: number;
    y: number;
}

// https://visjs.org/docs/network/#Events
interface VisPointerEvent {
    DOM: { x: number; y: number };
    canvas: { x: number; y: number };
}

interface VisClickEvent {
    edges: Array<number | string>;
    nodes: Array<number | string>;
    event: MouseEvent;
    pointer: VisPointerEvent;
}

interface VisDeselectEvent extends VisClickEvent {
    previousSelection: {
        edges: Array<number | string>;
        nodes: Array<number | string>;
    };
}

interface VisHoverEvent {
    node: string;
    event: MouseEvent;
    pointer: VisPointerEvent;
}

interface VisGraphProps {
    fitOnResize?: boolean;
    onNodeClick?: (clickedNode: VisGraphNodeType) => void;
    onNodeDoubleClick?: (clickedNode: VisGraphNodeType) => void;
    onNodeSelect?: (selectedNodes: VisGraphNodeType[]) => void;
    onNodeDeselect?: (selectedNodes: VisGraphNodeType[], previousSelectedNodes: VisGraphNodeType[]) => void;
    onNodeHover?: (node: VisGraphNodeType, coords: HoverNodeCoords) => void;
    onNodeBlur?: () => void;
    options: VisGraphOptions;
    seed?: string;
}

interface VisGraphState {
    selected?: string[];
}

export class VisGraph extends Component<VisGraphProps, VisGraphState> {
    static defaultProps = {
        fitOnResize: true,
    };

    data: {
        edges: DataSet<Edge>;
        nodes: DataSet<VisGraphNodeType>;
    };
    network: InternalVisNetwork;

    refs: {
        visgraph: HTMLElement;
    };

    constructor(props: VisGraphProps) {
        super(props);

        this.state = {
            selected: undefined,
        };
    }

    componentDidMount() {
        this.generateGraph(this.props);
    }

    componentWillUnmount() {
        this.destroyGraph();
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.props.seed !== nextProps.seed;
    }

    componentDidUpdate() {
        this.generateGraph(this.props);
    }

    highlightNode = (node: LineageNode, hover: boolean): void => {
        if (node && this.data) {
            // findNode will return any cluster node ids that the node is within.
            // If the node is in a cluster, highlight it the cluster instead
            const clusterIds = this.network.findNode(node.lsid);
            if (clusterIds && clusterIds.length) {
                const topNodeId = clusterIds[0];
                if (topNodeId) {
                    // reaching into the vis.js internal structure to get the graph's Node object
                    const internalNode = this.getInternalNode(topNodeId);
                    internalNode.hover = hover;

                    this.moveNodeToTop(topNodeId);

                    // force a redraw to see the hover state applied to the node
                    this.network.redraw();
                }
            }
        }
    };

    // move the node to the end of the list so it is drawn on top of any of it's neighbors
    private moveNodeToTop = (id: IdType): void => {
        const { nodeIndices } = this.network.body;
        const idx = nodeIndices.indexOf(id);
        nodeIndices.splice(idx, 1);
        nodeIndices.push(id);
    };

    destroyGraph = (): void => {
        if (this.network) {
            this.network.destroy();
            this.network = undefined;
        }
        if (this.data) {
            this.data = undefined;
        }
    };

    fitGraph = (): void => {
        this.network.fit();
    };

    private getInternalNode(id: IdType): InternalVisNode {
        return this.network.body.nodes[id];
    }

    getCombinedNodes(): VisGraphCombinedNode[] {
        return this.data.nodes.get({ filter: isCombinedNode });
    }

    getNodes(ids: IdType[]): VisGraphNodeType[] {
        return ids.map(id => this.getNode(id)).filter(n => n !== null && n !== undefined);
    }

    getNode(id: IdType): VisGraphNodeType {
        const node = this.data.nodes.get(id);
        if (node && this.network.isCluster(id)) {
            const nodesInCluster = this.network.getNodesInCluster(id);
            return {
                kind: 'cluster',
                id,
                nodesInCluster: this.getNodes(nodesInCluster),
            };
        }

        return node;
    }

    // set a selection on the vis.js graph and fire the select handler as if the user clicked on a node in the graph
    selectNodes = (ids: string[]): void => {
        const selectedNodes = this.getNodes(ids);
        this.doSelectNode(selectedNodes);

        // get the actual ids from the nodes -- some may not have been found
        this.network.setSelection({
            edges: [],
            nodes: selectedNodes.map(n => n.id),
        });
    };

    private doSelectNode(selectedNodes: VisGraphNodeType[]) {
        // change color of newly selected node
        const addToSelection = [];
        for (let i = 0; i < selectedNodes.length; i++) {
            const selectedNode = selectedNodes[i];
            if (!selectedNode) continue;
            addToSelection.push(selectedNode.id);
        }

        // add the newly selected node in the state
        this.setState(prevState => ({
            selected: this.unique(prevState.selected, addToSelection),
        }));

        if (this.props.onNodeSelect) {
            this.props.onNodeSelect(selectedNodes);
        }
    }

    // create a new array from the two arrays with any duplicates removed
    private unique = (a: string[], b: string[]): string[] => {
        const ret = [].concat(a);
        for (let i = 0; i < b.length; i++) {
            const item = b[i];
            if (ret.indexOf(item) == -1) ret.push(item);
        }
        return ret;
    };

    private doClick = (id: IdType): void => {
        const clickedNode = this.getNode(id);
        if (clickedNode) {
            if (this.props.onNodeClick) {
                this.props.onNodeClick(clickedNode);
            }
        } else {
            // it could happen that the graph was reset after an expanded node was selected in which case the selected node might no longer exist
            // the node specified by selected no longer exist so reset selected
            this.setState(prevState => {
                let newSelected;
                if (prevState.selected) {
                    newSelected = [];
                    for (let i = 0; i < prevState.selected.length; i++) {
                        if (prevState.selected[i] !== id) newSelected.push(prevState.selected[i]);
                    }
                }
                return { selected: newSelected };
            });
        }
    };

    private doAfterDrawing = (ctx: CanvasRenderingContext2D): void => {
        this.getCombinedNodes().forEach(combinedNode => {
            const internalNode = this.getInternalNode(combinedNode.id);
            if (!internalNode) {
                console.error('internal node not found for combined node: ' + combinedNode.id);
                return;
            }

            const { shape } = internalNode;
            const nodeCount = combinedNode.containedNodes.length;

            // set up circle clip area
            drawCircle(ctx, internalNode.x, internalNode.y, shape.radius);
            ctx.save();
            ctx.clip();

            // calculate the size of the font based on the shape size
            const text = '' + nodeCount;
            let fontSize = 28;
            let textMetrics;
            while (true) {
                if (fontSize < 8) break;
                ctx.font = fontSize + 'px arial';
                textMetrics = ctx.measureText(text);
                if (textMetrics.width < shape.width - 8) break;
                fontSize -= 4;
            }

            ctx.fillStyle = 'rgba(0,0,0,0.9)';
            ctx.shadowColor = 'rgba(0,0,0,0.25)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;

            ctx.fillText(text, internalNode.x - textMetrics.width / 2, internalNode.y - fontSize / 2);

            // remove clip
            ctx.restore();
        });
    };

    onReset = (selectSeed: boolean): void => {
        if (selectSeed) {
            this.selectNodes(this.props.options.initialSelection);
        }
        this.fitGraph();
    };

    getNetwork = (): Network => {
        return this.network;
    };

    private generateGraph(props: VisGraphProps) {
        const { fitOnResize, options } = props;
        const { selected } = this.state;

        this.destroyGraph();

        const data = (this.data = {
            edges: options.edges,
            nodes: options.nodes,
        });
        this.network = new Network(this.refs.visgraph, data, options.options) as InternalVisNetwork;

        this.network.on('click', (visEvent: VisClickEvent) => {
            if (visEvent.nodes.length === 1) {
                this.doClick(visEvent.nodes[0]);
            }
        });

        this.network.on('doubleClick', (visEvent: VisClickEvent) => {
            if (visEvent.nodes.length === 1) {
                const clickedNode = this.getNode(visEvent.nodes[0]);
                if (this.props.onNodeDoubleClick) {
                    this.props.onNodeDoubleClick(clickedNode);
                }
            }
        });

        this.network.on('hoverNode', (event: VisHoverEvent) => {
            this.network.body.container.style.cursor = 'pointer';

            const id = event.node;
            const node = this.getNode(id);
            if (node) {
                this.moveNodeToTop(id);

                if (this.props.onNodeHover) {
                    const canvasBox = this.network.getBoundingBox(id);

                    // convert the node's canvas box to DOM coordinates
                    const topLeftDOM = this.network.canvasToDOM({
                        x: canvasBox.left,
                        y: canvasBox.top,
                    });
                    const bottomRightDOM = this.network.canvasToDOM({
                        x: canvasBox.right,
                        y: canvasBox.bottom,
                    });

                    const rect = this.refs.visgraph.getBoundingClientRect();
                    const coords = {
                        top: rect.top + topLeftDOM.y,
                        left: rect.left + topLeftDOM.x,
                        bottom: rect.top + bottomRightDOM.y,
                        right: rect.left + bottomRightDOM.x,
                    };
                    this.props.onNodeHover(node, coords);
                }
            }
        });

        this.network.on('blurNode', () => {
            this.network.body.container.style.cursor = 'default';
            if (this.props.onNodeBlur) {
                this.props.onNodeBlur();
            }
        });

        this.network.on('selectNode', (visEvent: VisClickEvent) => {
            this.doSelectNode(this.getNodes(visEvent.nodes));
        });

        this.network.on('deselectNode', (visEvent: VisDeselectEvent) => {
            const selectedNodes = this.getNodes(visEvent.nodes);
            const previousSelectedNodes = this.getNodes(visEvent.previousSelection.nodes);
            if (this.props.onNodeDeselect) {
                this.props.onNodeDeselect(selectedNodes, previousSelectedNodes);
            }
        });

        this.network.on('afterDrawing', this.doAfterDrawing);

        if (fitOnResize) {
            let resize: number;
            this.network.on('resize', () => {
                // delay required to allow for element resizing to occur
                clearTimeout(resize);
                resize = window.setTimeout(() => {
                    resize = undefined;
                    this.network.redraw();
                    this.fitGraph();
                }, 75);
            });
        }

        const toSelect = props.options.initialSelection || selected;
        if (toSelect && toSelect.length) {
            this.selectNodes(toSelect);
        }

        this.fitGraph();
    }

    render() {
        // leave just enough room so the footer doesn't get pushed down when the visjs graph shows
        const graphHeight = window.innerHeight - 350;

        return (
            <div className="lineage-visgraph-ct">
                <div ref="visgraph" style={{ height: graphHeight }} />
                <VisGraphControls getNetwork={this.getNetwork} onReset={this.onReset} />
            </div>
        );
    }
}
