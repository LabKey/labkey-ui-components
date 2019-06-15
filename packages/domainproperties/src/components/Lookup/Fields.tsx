import * as React from "react";
import { List } from "immutable";
import { FormControl } from "react-bootstrap";
import { Container, SchemaDetails } from "@glass/base";

import { QueryInfoLite } from "../../models";

interface IFolderSelectProps {
    container?: Container
    dataProvider: () => Promise<List<Container>>
    id: string
    onChange: (any) => any
    value?: any
}

interface IFolderSelectState {
    containers: List<Container>
    loading: boolean
}

export class FolderSelect extends React.Component<IFolderSelectProps, IFolderSelectState> {

    constructor(props) {
        super(props);

        this.state = {
            containers: List(),
            loading: false
        };
    }

    componentDidMount(): void {
        this.setState({
            loading: true
        });

        this.props.dataProvider().then((containers) => {
            this.setState({
                containers,
                loading: false
            });
        });
    }

    render() {
        const { container, id, onChange, value } = this.props;
        const { containers } = this.state;

        return (
            <FormControl componentClass="select"
                         value={value}
                         id={id}
                         onChange={onChange}>
                {container && (
                    <option value={null}>Current Folder</option>
                )}
                {containers.map((c) => <option key={c.id} value={c.path}>{c.path}</option>).toArray()}
            </FormControl>
        )
    }
}

interface IQuerySelectProps {
    containerPath: string
    dataProvider: (containerPath: string, schemaName: string) => Promise<List<QueryInfoLite>>
    id: string
    onChange: (any) => any
    schemaName: string
    value?: any
}

interface IQuerySelectState {
    containerPath?: string
    loading?: boolean
    prevPath?: string
    prevSchemaName?: string
    queries?: List<QueryInfoLite>
}

export class QuerySelect extends React.Component<IQuerySelectProps, IQuerySelectState> {

    constructor(props) {
        super(props);

        this.state = {
            containerPath: null, // explicitly use "null" instead of "undefined" due to container API
            loading: false,
            prevPath: null,
            prevSchemaName: undefined,
            queries: List()
        };
    }

    static getDerivedStateFromProps(nextProps: IQuerySelectProps, prevState: IQuerySelectState): IQuerySelectState {
        if (QuerySelect.isChanged(nextProps, prevState)) {
            return {
                prevPath: nextProps.containerPath,
                prevSchemaName: nextProps.schemaName
            };
        }

        // no state update
        return null;
    }

    static isChanged(props: Readonly<IQuerySelectProps>, state: Readonly<IQuerySelectState>): boolean {
        return (props.containerPath !== state.prevPath || props.schemaName !== state.prevSchemaName)
    }

    componentDidMount(): void {
        this.loadData();
    }

    componentDidUpdate(prevProps: Readonly<IQuerySelectProps>, prevState: Readonly<IQuerySelectState>, snapshot?: any): void {
        if (QuerySelect.isChanged(prevProps, this.state)) {
            this.loadData();
        }
    }

    loadData(): void {
        const { containerPath, dataProvider, schemaName } = this.props;

        this.setState({
            loading: true,
            prevPath: containerPath,
            prevSchemaName: schemaName
        });

        dataProvider(containerPath, schemaName).then((queries) => {
            this.setState({
                loading: false,
                queries
            });
        });
    }

    render() {
        const { id, onChange, value } = this.props;
        const { queries } = this.state;

        const isEmpty = queries.size === 0;
        const hasValue = !!value;
        const blankOption = !hasValue && !isEmpty;

        return (
            <FormControl componentClass="select"
                         value={value}
                         id={id}
                         onChange={onChange}>
                {blankOption && <option key="_default" value={undefined}/>}
                {queries.map((q) => <option key={q.name} value={q.name}>{q.name}</option>).toArray()}
                {isEmpty && <option disabled key="_empty" value={undefined}>(No tables)</option>}
            </FormControl>
        )
    }
}

interface ISchemaSelectProps {
    containerPath: string
    dataProvider: (containerPath: string) => Promise<List<SchemaDetails>>
    id: string
    onChange: (any) => any
    value?: any
}

interface ISchemaSelectState {
    containerPath?: string
    loading?: boolean
    prevPath?: string
    schemas?: List<SchemaDetails>
}

export class SchemaSelect extends React.Component<ISchemaSelectProps, ISchemaSelectState> {

    constructor(props) {
        super(props);

        this.state = {
            containerPath: null, // explicitly use "null" instead of "undefined" due to container API
            loading: false,
            prevPath: null,
            schemas: List()
        };
    }

    static getDerivedStateFromProps(nextProps: ISchemaSelectProps, prevState: ISchemaSelectState): ISchemaSelectState {
        if (nextProps.containerPath !== prevState.containerPath) {
            return {
                prevPath: nextProps.containerPath
            };
        }

        // no state update
        return null;
    }

    componentDidMount(): void {
        this.loadData();
    }

    componentDidUpdate(prevProps: Readonly<ISchemaSelectProps>, prevState: Readonly<ISchemaSelectState>, snapshot?: any): void {
        if (prevProps.containerPath !== this.state.prevPath) {
            this.loadData();
        }
    }

    loadData(): void {
        const { containerPath, dataProvider } = this.props;

        this.setState({
            loading: true,
            prevPath: containerPath
        });

        dataProvider(containerPath).then((schemas) => {
            this.setState({
                loading: false,
                schemas
            });
        });
    }

    render() {
        const { id, onChange, value } = this.props;
        const { schemas } = this.state;

        const isEmpty = schemas.size === 0;
        const hasValue = !!value;
        const blankOption = !hasValue && !isEmpty;

        return (
            <FormControl componentClass="select"
                         value={value}
                         id={id}
                         onChange={onChange}
                         placeholder="Select Schema">
                {blankOption && <option key="_default" value={undefined}/>}
                {schemas.map((s) => <option key={s.fullyQualifiedName} value={s.fullyQualifiedName}>{s.getLabel()}</option>).toArray()}
                {isEmpty && <option disabled key="_empty" value={undefined}>(No schemas)</option>}
            </FormControl>
        )
    }
}