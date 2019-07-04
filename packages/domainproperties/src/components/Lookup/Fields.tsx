import * as React from "react";
import { List } from "immutable";
import { FormControl } from "react-bootstrap";
import { Container, SchemaDetails } from "@glass/base";

import { PropDescType } from "../../models";

import { ILookupContext, LookupContextConsumer } from "./Context";

interface ILookupProps {
    context: ILookupContext
}

interface IFolderSelectProps {
    id: string
    onChange: (any) => any
    value?: any
}

export class FolderSelect extends React.PureComponent<IFolderSelectProps, any> {

    render() {
        return (
            <LookupContextConsumer>
                {(context) => <FolderSelectImpl {...this.props} context={context}/>}
            </LookupContextConsumer>
        );
    }
}

interface IFolderSelectImplState {
    containers: List<Container>
    loading: boolean
}

type FolderSelectProps = IFolderSelectProps & ILookupProps;

class FolderSelectImpl extends React.Component<FolderSelectProps, IFolderSelectImplState> {

    constructor(props) {
        super(props);

        this.state = {
            containers: List(),
            loading: false
        };
    }

    componentDidMount(): void {
        const { context } = this.props;

        this.setState({
            loading: true
        });

        context.fetchContainers().then((containers) => {
            this.setState({
                containers,
                loading: false
            });
        });
    }

    render() {
        const { context } = this.props;
        const { containers } = this.state;

        return (
            <FormControl {...this.props} componentClass="select">
                {context.activeContainer && (
                    <option key="_current" value={context.activeContainer.path}>Current Folder</option>
                )}
                {containers.map((c) => <option key={c.id} value={c.path}>{c.path}</option>).toArray()}
            </FormControl>
        )
    }
}

interface IQuerySelectProps {
    containerPath: string
    id: string
    onChange: (any) => any
    schemaName: string
    value?: any
}

export class QuerySelect extends React.PureComponent<IQuerySelectProps, any> {

    render() {
        return (
            <LookupContextConsumer>
                {(context) => <QuerySelectImpl {...this.props} context={context}/>}
            </LookupContextConsumer>
        );
    }
}

interface IQuerySelectImplState {
    containerPath?: string
    loading?: boolean
    prevPath?: string
    prevSchemaName?: string
    queries?: List<{name: string, type: PropDescType}>
}

type QuerySelectProps = IQuerySelectProps & ILookupProps;

class QuerySelectImpl extends React.Component<QuerySelectProps, IQuerySelectImplState> {

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

    static getDerivedStateFromProps(nextProps: QuerySelectProps, prevState: IQuerySelectImplState): IQuerySelectImplState {
        if (QuerySelectImpl.isChanged(nextProps, prevState)) {
            return {
                prevPath: nextProps.containerPath,
                prevSchemaName: nextProps.schemaName
            };
        }

        // no state update
        return null;
    }

    static isChanged(props: Readonly<QuerySelectProps>, state: Readonly<IQuerySelectImplState>): boolean {
        return (props.containerPath !== state.prevPath || props.schemaName !== state.prevSchemaName)
    }

    componentDidMount(): void {
        this.loadData();
    }

    componentDidUpdate(prevProps: Readonly<QuerySelectProps>, prevState: Readonly<IQuerySelectImplState>, snapshot?: any): void {
        if (QuerySelectImpl.isChanged(prevProps, this.state)) {
            this.loadData();
        }
    }

    loadData(): void {
        const { containerPath, context, schemaName } = this.props;

        this.setState({
            loading: true,
            prevPath: containerPath,
            prevSchemaName: schemaName
        });

        context.fetchQueries(containerPath, schemaName).then((queries) => {
            this.setState({
                loading: false,
                queries: queries
                    .map(q => q.getLookupInfo()).
                    filter(li => li !== undefined)
                    .toList()
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
                {queries.map((q) => <option key={q.name} value={q.name}>{q.name} ({q.type.display})</option>).toArray()}
                {isEmpty && <option disabled key="_empty" value={undefined}>(No tables)</option>}
            </FormControl>
        )
    }
}

interface ISchemaSelectProps {
    containerPath: string
    id: string
    onChange: (any) => any
    value?: any
}

export class SchemaSelect extends React.PureComponent<ISchemaSelectProps, any> {

    render() {
        return (
            <LookupContextConsumer>
                {(context) => <SchemaSelectImpl {...this.props} context={context}/>}
            </LookupContextConsumer>
        );
    }
}

type SchemaSelectProps = ISchemaSelectProps & ILookupProps;

interface ISchemaSelectImplState {
    containerPath?: string
    loading?: boolean
    prevPath?: string
    schemas?: List<SchemaDetails>
}

class SchemaSelectImpl extends React.Component<SchemaSelectProps, ISchemaSelectImplState> {

    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            prevPath: null,
            schemas: List()
        };
    }

    static getDerivedStateFromProps(nextProps: SchemaSelectProps, prevState: ISchemaSelectImplState): ISchemaSelectImplState {
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

    componentDidUpdate(prevProps: Readonly<SchemaSelectProps>, prevState: Readonly<ISchemaSelectImplState>, snapshot?: any): void {
        if (prevProps.containerPath !== this.state.prevPath) {
            this.loadData();
        }
    }

    loadData(): void {
        const { containerPath, context } = this.props;

        this.setState({
            loading: true,
            prevPath: containerPath
        });

        context.fetchSchemas(containerPath).then((schemas) => {
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