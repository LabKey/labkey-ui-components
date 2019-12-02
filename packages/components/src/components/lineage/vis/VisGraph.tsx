/*
 * Copyright (c) 2017-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { Button, DropdownButton, MenuItem } from 'react-bootstrap'
import { DataSet, Edge, Network, Node, Options } from 'vis'

import {
    isCombinedNode,
    VisGraphClusterNode,
    VisGraphCombinedNode,
    VisGraphNode,
    VisGraphOptions,
} from './VisGraphGenerator'
import { LineageNode } from '../models'

enum LayoutTypes {
    VERTICAL = 'VERTICAL',
    HORIZONTAL = 'HORIZONTAL'
}

interface IGraphLayout {
    name: string
    options: Options
}

let LAYOUTS = {
    [LayoutTypes.VERTICAL]: {
        name: 'Vertical',
        options: {
            layout: {
                hierarchical: {
                    enabled: true,
                    direction: 'UD'
                }
            },
            physics: {
                enabled: false
            }
        }
    },
    [LayoutTypes.HORIZONTAL]: {
        name: 'Horizontal',
        options: {
            layout: {
                hierarchical: {
                    enabled: true,
                    direction: 'LR'
                }
            },
            physics: {
                enabled: false
            }
        }
    }
};

// defined in vis/lib/network/shapes.js
interface InternalVisContext2D {
    circle(x: number, y: number, r: number);
    square(x: number, y: number, r: number);
    triangle(x: number, y: number, r: number);
    triangleDown(x: number, y: number, r: number);
    star(x: number, y: number, r: number);
    diamond(x: number, y: number, r: number);
    roundRect(x: number, y: number, w: number, h: number, r: number);
    ellipse_vis(x: number, y: number, w: number, h: number);
    database(x: number, y: number, w: number, h: number);
    dashedLine(x: number, y: number, w: number, h: number);
    hexagon(x: number, y: number, r: number);
}

// defined in vis/lib/network/shapes.js
interface InternalVisNetwork extends Network {
    body: {
        container: HTMLElement
        nodes: {[key:string]: InternalVisNode}
        nodeIndices: Array<string>
    },
    layoutEngine: {
        _centerParent: (node: InternalVisNode) => void
    }
}

// defined in vis/lib/network/modules/components/Node.js
interface InternalVisNode {
    options: Node
    id: string
    shape: {
        top: number
        left: number
        width: number
        height: number
        radius: number
    }
    hover: boolean
    x: number
    y: number
}

// https://visjs.org/docs/network/#Events
interface VisPointerEvent {
    DOM: { x: number, y: number }
    canvas: { x: number, y: number }
}

interface VisClickEvent {
    edges: Array<number | string>
    nodes: Array<number | string>
    event: MouseEvent
    pointer: VisPointerEvent
}

interface VisDeselectEvent extends VisClickEvent {
    previousSelection: {
        edges: Array<number | string>,
        nodes: Array<number | string>
    }
}

interface VisHoverEvent {
    node: string
    event: MouseEvent
    pointer: VisPointerEvent
}

interface VisGraphProps {
    fitOnResize?: boolean
    lineageGridHref?: string
    onNodeClick?: (clickedNode: VisGraphNode | VisGraphCombinedNode | VisGraphClusterNode) => void
    onNodeDoubleClick?: (clickedNode: VisGraphNode | VisGraphCombinedNode | VisGraphClusterNode) => void
    onNodeSelect?: (selectedNodes: Array<VisGraphNode | VisGraphCombinedNode | VisGraphClusterNode>) => void
    onNodeDeselect?: (selectedNodes: Array<VisGraphNode | VisGraphCombinedNode | VisGraphClusterNode>, previousSelectedNodes: Array<VisGraphNode | VisGraphCombinedNode | VisGraphClusterNode>) => void
    onNodeHover?: (node: VisGraphNode | VisGraphCombinedNode | VisGraphClusterNode, coords: {top: number, left: number, bottom: number, right: number}) => void
    onNodeBlur?: () => void
    options: VisGraphOptions
    seed?: string
}

interface VisGraphState {
    selected?: Array<string>
}

export class VisGraph extends React.Component<VisGraphProps, VisGraphState> {

    static defaultProps = {
        fitOnResize: true
    };

    data: {
        edges: DataSet<Edge>;
        nodes: DataSet<VisGraphNode | VisGraphCombinedNode>;
    };
    network: InternalVisNetwork;

    refs: {
        visgraph: HTMLElement
        settingsPopover: any
    };

    constructor(props: VisGraphProps) {
        super(props);

        this.fitGraph = this.fitGraph.bind(this);
        this.getNetwork = this.getNetwork.bind(this);
        this.showAllSettings = this.showAllSettings.bind(this);
        this.hideAllSettings = this.hideAllSettings.bind(this);
        this.onReset = this.onReset.bind(this);
        this.doAfterDrawing = this.doAfterDrawing.bind(this);

        this.state = {
            selected: undefined
        };
    }

    componentDidMount() {
        this.generateGraph(this.props);
    }

    componentWillUnmount() {
        this.destroyGraph();
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (this.props.seed !== nextProps.seed) {
            return true;
        }

        return false;
    }

    componentDidUpdate() {
        this.generateGraph(this.props);
    }

    public highlightNode(node: LineageNode, hover: boolean) {
        if (node && this.data) {
            const lsid = node.get('lsid');

            // findNode will return any cluster node ids that the node is within.
            // If the node is in a cluster, highlight it the cluster instead
            const clusterIds = this.network.findNode(lsid);
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

    // move the node to the end of the list so it is drawn on top of any of it's neighbors
    private moveNodeToTop(lsid) {
        const body = this.network.body;
        let nodeIndices = body.nodeIndices;
        let idx = nodeIndices.indexOf(lsid);
        nodeIndices.splice(idx, 1);
        nodeIndices.push(lsid);
    }

    destroyGraph() {
        if (this.network) {
            this.network.destroy();
            this.network = undefined;
        }
        if (this.data) {
            this.data = undefined;
        }
    }

    showAllSettings() {
        this.network.setOptions({
            configure: true
        });
    }

    hideAllSettings() {
        this.network.setOptions({
            configure: false
        });
    }

    fitGraph() {
        this.network.fit();
    }

    private getInternalNode(id: string | number): InternalVisNode {
        return this.network.body.nodes[id];
    }

    public getCombinedNodes(): Array<VisGraphCombinedNode> {
        return this.data.nodes.get({filter: isCombinedNode}) as Array<VisGraphCombinedNode>;
    }

    public getNodes(ids: Array<string | number>): Array<VisGraphNode | VisGraphCombinedNode | VisGraphClusterNode> {
        return ids.map(id => this.getNode(id)).filter(n => n !== null && n !== undefined);
    }

    public getNode(id: string | number): VisGraphNode | VisGraphCombinedNode | VisGraphClusterNode | null {
        const node = this.data.nodes.get(id);
        if (node && this.network.isCluster(id)) {
            let nodesInCluster = this.network.getNodesInCluster(id);
            return {
                kind: 'cluster',
                id,
                nodesInCluster: this.getNodes(nodesInCluster)
            };
        }

        return node;
    }

    // set a selection on the vis.js graph and fire the select handler as if the user clicked on a node in the graph
    public selectNodes(ids: Array<string>) {
        const selectedNodes = this.getNodes(ids);
        this.doSelectNode(this.data, selectedNodes);

        // get the actual ids from the nodes -- some may not have been found
        const actualIds = selectedNodes.map(n => n.id);
        this.network.setSelection({nodes: actualIds, edges: []});
    }

    private doSelectNode(data, selectedNodes: Array<VisGraphNode | VisGraphCombinedNode | VisGraphClusterNode>) {
        // change color of newly selected node
        let addToSelection = [];
        for (let i = 0; i < selectedNodes.length; i++) {
            const selectedNode = selectedNodes[i];
            if (!selectedNode)
                continue;
            addToSelection.push(selectedNode.id);
        }

        // add the newly selected node in the state
        this.setState((prevState, props) => {
            selected: this.unique(prevState.selected, addToSelection)
        });

        if (this.props.onNodeSelect) {
            this.props.onNodeSelect(selectedNodes);
        }
    }

    // create a new array from the two arrays with any duplicates removed
    private unique(a: Array<string>, b: Array<string>) {
        let ret = [].concat(a);
        for (let i = 0; i < b.length; i++) {
            let item = b[i];
            if (ret.indexOf(item) == -1)
                ret.push(item);
        }
        return ret;
    }

    private doDeselectNode(data, selectedNodes: Array<VisGraphNode | VisGraphCombinedNode | VisGraphClusterNode>, previousSelectedNodes: Array<VisGraphNode | VisGraphCombinedNode | VisGraphClusterNode>) {
        if (this.props.onNodeDeselect) {
            this.props.onNodeDeselect(selectedNodes, previousSelectedNodes);
        }
    }

    private doClick(data, id: string | number) {
        const clickedNode = this.getNode(id);
        if (clickedNode) {
            if (this.props.onNodeClick) {
                this.props.onNodeClick(clickedNode);
            }
        }
        else {
            // it could happen that the graph was reset after an expanded node was selected in which case the selected node might no longer exist
            // the node specified by selected no longer exist so reset selected
            this.setState((prevState, props) => {
                let newSelected = undefined;
                if (prevState.selected) {
                    newSelected = [];
                    for (let i = 0; i < prevState.selected.length; i++) {
                        if (prevState.selected[i] !== id)
                            newSelected.push(prevState.selected[i]);
                    }
                }
                return { selected: newSelected };
            })
        }
    }

    private doAfterDrawing(ctx: CanvasRenderingContext2D & InternalVisContext2D) {
        const combinedNodes = this.getCombinedNodes();
        combinedNodes.forEach(combinedNode => {
            const internalNode = this.getInternalNode(combinedNode.id);
            if (!internalNode) {
                console.error('internal node not found for combined node: ' + combinedNode.id);
                return;
            }

            const shape = internalNode.shape;
            const nodeCount = combinedNode.containedNodes.length;

            // set up circle clip area
            ctx.circle(internalNode.x, internalNode.y, shape.radius);
            ctx.save();
            ctx.clip();

            // calculate the size of the font based on the shape size
            const text = "" + nodeCount;
            let fontSize = 28;
            let textMetrics;
            while (true) {
                if (fontSize < 8)
                    break;
                ctx.font = fontSize + 'px arial';
                textMetrics = ctx.measureText(text);
                if (textMetrics.width < shape.width - 8)
                    break;
                fontSize -= 4;
            }

            ctx.fillStyle = 'rgba(0,0,0,0.9)';
            ctx.shadowColor = 'rgba(0,0,0,0.25)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;

            ctx.fillText(text, internalNode.x - (textMetrics.width/2), internalNode.y - (fontSize/2));

            // remove clip
            ctx.restore();
        });
    }

    private generateGraph(props: VisGraphProps) {
        // console.log('VisGraph.generateGraph');
        const { fitOnResize, options } = props;
        const { selected } = this.state;

        this.destroyGraph();

        const data = this.data = {
            edges: options.edges,
            nodes: options.nodes
        };
        this.network = new Network(this.refs.visgraph, data, options.options) as InternalVisNetwork;

        this.network.on('click', (visEvent: VisClickEvent) => {
            if (visEvent.nodes.length === 1) {
                this.doClick(data, visEvent.nodes[0]);
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
                        y: canvasBox.top
                    });
                    const bottomRightDOM = this.network.canvasToDOM({
                        x: canvasBox.right,
                        y: canvasBox.bottom
                    });

                    const rect = this.refs.visgraph.getBoundingClientRect();
                    const coords = {
                        top: rect.top + topLeftDOM.y,
                        left: rect.left + topLeftDOM.x,
                        bottom: rect.top + bottomRightDOM.y,
                        right: rect.left + bottomRightDOM.x
                    }
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
            const selectedNodes = this.getNodes(visEvent.nodes);
            this.doSelectNode(data, selectedNodes);
        });

        this.network.on('deselectNode', (visEvent: VisDeselectEvent) => {
            const selectedNodes = this.getNodes(visEvent.nodes);
            const previousSelectedNodes = this.getNodes(visEvent.previousSelection.nodes);
            this.doDeselectNode(data, selectedNodes, previousSelectedNodes);
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

    getNetwork(): Network {
        return this.network;
    }

    onReset(selectSeed: boolean) {
        if (selectSeed) {
            this.selectNodes(this.props.options.initialSelection);
        }
    }

    render() {
        // leave just enough room so the footer doesn't get pushed down when the visjs graph shows
        const graphHeight = window.innerHeight - 350;

        return (
            <div className="lineage-visgraph-ct">
                <div ref="visgraph" style={{height: graphHeight}}/>
                <GraphControls getNetwork={this.getNetwork}
                               lineageGridHref={this.props.lineageGridHref}
                               onReset={this.onReset}
                              />
            </div>
        );
    }
}

interface GraphControlsProps {
    getNetwork: () => Network
    lineageGridHref?: string
    onReset: (selectSeed) => any
}

class GraphControls extends React.Component<GraphControlsProps, any> {

    constructor(props: GraphControlsProps) {
        super(props);

        this.graphReset = this.graphReset.bind(this);
        this.panDown = this.panDown.bind(this);
        this.panLeft = this.panLeft.bind(this);
        this.panRight = this.panRight.bind(this);
        this.panUp = this.panUp.bind(this);
        this.zoomIn = this.zoomIn.bind(this);
        this.zoomOut = this.zoomOut.bind(this);
    }

    graphReset(selectSeed: boolean) {
        if (this.props.onReset) {
            this.props.onReset(selectSeed);
        }
    }

    panDown() {
        this.props.getNetwork().moveTo({ offset: { y: -20, x:0 } });
    }

    panUp() {
        this.props.getNetwork().moveTo({ offset: { y: 20, x:0 } });
    }

    panLeft() {
        this.props.getNetwork().moveTo({ offset: { x: 20, y:0 } });
    }

    panRight() {
        this.props.getNetwork().moveTo({ offset: { x: -20, y:0 } });
    }

    zoomIn() {
        let network = this.props.getNetwork();
        network.moveTo({
            scale: network.getScale() + 0.05
        });
    }

    zoomOut() {
        let network = this.props.getNetwork();
        let scale = network.getScale() - 0.05;
        if (scale > 0) {
            network.moveTo({ scale });
        }
    }

    render() {
        return (
            <div className="lineage-visgraph-controls">
                <div className="lineage-visgraph-control-settings">
                    <div className="btn-group">
                        <DropdownButton id="graph-control-dd" title={<i className="fa fa-undo"/>} pullRight>
                            <MenuItem onClick={() => this.graphReset(true)}>Reset view and select seed</MenuItem>
                            <MenuItem onClick={() => this.graphReset(false)}>Reset view</MenuItem>
                        </DropdownButton>
                    </div>
                </div>
                <div className="lineage-visgraph-control-zoom">
                    <div className="btn-group">
                        <Button onClick={this.zoomOut}><i className="fa fa-search-minus"/></Button>
                        <Button onClick={this.zoomIn}><i className="fa fa-search-plus"/></Button>
                    </div>
                </div>
                <div className="lineage-visgraph-control-pan">
                    <Button className="lineage-visgraph-control-pan-up" onClick={this.panUp}>
                        <i className="fa fa-arrow-up"/>
                    </Button>
                    <div className="btn-group">
                        <Button onClick={this.panLeft}><i className="fa fa-arrow-left"/></Button>
                        <Button onClick={this.panDown}><i className="fa fa-arrow-down"/></Button>
                        <Button onClick={this.panRight}><i className="fa fa-arrow-right"/></Button>
                    </div>
                </div>
            </div>
        )
    }
}
