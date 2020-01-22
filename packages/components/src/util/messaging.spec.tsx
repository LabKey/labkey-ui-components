import React from 'react';
import { resolveErrorMessage } from './messaging';

describe("resolveErrorMessage", () => {
    test("original is string", () => {
        expect(resolveErrorMessage("error string", "data", undefined, 'default message')).toBe("error string");
    });

    test("original is InsertRowsErrorResponse", () => {
        expect(resolveErrorMessage({exception: "exception message"}, "data", undefined, "default message")).toBe("exception message");
    });

    test("with message and exception", () => {
        expect(resolveErrorMessage({exception: "exception message", message: "other message"}, "test data", undefined)).toBe("other message");
    });

    test("duplicate key violation exception", () => {
        const error = {
            "exception" : "ERROR: duplicate key value violates unique constraint \"uq_material_lsid\"\n  Detail: Key (lsid)=(urn:lsid:labkey.com:Sample.252.Examples:E-20200121-743) already exists.\n  Where: SQL statement \"INSERT INTO exp.material (lsid, name, cpastype, runid, created, container, createdby, modifiedby, modified, lastindexed, description, objectid)\nSELECT $1.lsid, $1.Name, 'urn:lsid:labkey.com:SampleSet.Folder-252:Examples', $1.RunId, CURRENT_TIMESTAMP, '578a3330-dee0-1037-bdca-4e2bf136af84', 1005, 1005, CURRENT_TIMESTAMP, $1.LastIndexed, $1.Description, _$objectid$_\nRETURNING rowid\"\nPL/pgSQL function temp.fn_cb4838bd5008e21ca0ebb3e8d366d2cf(temp.fn_cb4838bd5008e21ca0ebb3e8d366d2cftype) line 10 at SQL statement",
            "extraContext" : { },
            "success" : false,
            "errors" : [ {
                "exception" : "ERROR: duplicate key value violates unique constraint \"uq_material_lsid\"\n  Detail: Key (lsid)=(urn:lsid:labkey.com:Sample.252.Examples:E-20200121-743) already exists.\n  Where: SQL statement \"INSERT INTO exp.material (lsid, name, cpastype, runid, created, container, createdby, modifiedby, modified, lastindexed, description, objectid)\nSELECT $1.lsid, $1.Name, 'urn:lsid:labkey.com:SampleSet.Folder-252:Examples', $1.RunId, CURRENT_TIMESTAMP, '578a3330-dee0-1037-bdca-4e2bf136af84', 1005, 1005, CURRENT_TIMESTAMP, $1.LastIndexed, $1.Description, _$objectid$_\nRETURNING rowid\"\nPL/pgSQL function temp.fn_cb4838bd5008e21ca0ebb3e8d366d2cf(temp.fn_cb4838bd5008e21ca0ebb3e8d366d2cftype) line 10 at SQL statement",
                "rowNumber" : 1,
                "errors" : [ {
                    "msg" : "ERROR: duplicate key value violates unique constraint \"uq_material_lsid\"\n  Detail: Key (lsid)=(urn:lsid:labkey.com:Sample.252.Examples:E-20200121-743) already exists.\n  Where: SQL statement \"INSERT INTO exp.material (lsid, name, cpastype, runid, created, container, createdby, modifiedby, modified, lastindexed, description, objectid)\nSELECT $1.lsid, $1.Name, 'urn:lsid:labkey.com:SampleSet.Folder-252:Examples', $1.RunId, CURRENT_TIMESTAMP, '578a3330-dee0-1037-bdca-4e2bf136af84', 1005, 1005, CURRENT_TIMESTAMP, $1.LastIndexed, $1.Description, _$objectid$_\nRETURNING rowid\"\nPL/pgSQL function temp.fn_cb4838bd5008e21ca0ebb3e8d366d2cf(temp.fn_cb4838bd5008e21ca0ebb3e8d366d2cftype) line 10 at SQL statement",
                    "message" : "ERROR: duplicate key value violates unique constraint \"uq_material_lsid\"\n  Detail: Key (lsid)=(urn:lsid:labkey.com:Sample.252.Examples:E-20200121-743) already exists.\n  Where: SQL statement \"INSERT INTO exp.material (lsid, name, cpastype, runid, created, container, createdby, modifiedby, modified, lastindexed, description, objectid)\nSELECT $1.lsid, $1.Name, 'urn:lsid:labkey.com:SampleSet.Folder-252:Examples', $1.RunId, CURRENT_TIMESTAMP, '578a3330-dee0-1037-bdca-4e2bf136af84', 1005, 1005, CURRENT_TIMESTAMP, $1.LastIndexed, $1.Description, _$objectid$_\nRETURNING rowid\"\nPL/pgSQL function temp.fn_cb4838bd5008e21ca0ebb3e8d366d2cf(temp.fn_cb4838bd5008e21ca0ebb3e8d366d2cftype) line 10 at SQL statement"
                } ]
            } ],
            "errorCount" : 1
        };
        expect(resolveErrorMessage(error, "samples", undefined)).toBe("There was a problem creating your samples.  Check the existing samples for possible duplicates and make sure any referenced samples are still valid.")
    });

    test("Existing row now found", () => {
        const error = {
            "exception" : "The existing row was not found.",
            "exceptionClass" : "org.labkey.api.view.NotFoundException",
            "stackTrace" : [ "org.labkey.api.query.AbstractQueryUpdateService.updateRows(AbstractQueryUpdateService.java:548)", "org.labkey.experiment.api.SampleSetUpdateServiceDI.updateRows(SampleSetUpdateServiceDI.java:184)", "org.labkey.query.controllers.QueryController$CommandType$4.saveRows(QueryController.java:3511)", "org.labkey.query.controllers.QueryController$BaseSaveRowsAction.executeJson(QueryController.java:3669)", "org.labkey.query.controllers.QueryController$UpdateRowsAction.execute(QueryController.java:3735)", "org.labkey.query.controllers.QueryController$UpdateRowsAction.execute(QueryController.java:3728)", "org.labkey.api.action.BaseApiAction.handlePost(BaseApiAction.java:228)", "org.labkey.api.action.BaseApiAction.handleRequest(BaseApiAction.java:146)", "org.labkey.api.action.BaseViewAction.handleRequest(BaseViewAction.java:175)", "org.labkey.api.action.SpringActionController.handleRequest(SpringActionController.java:491)", "org.labkey.api.module.DefaultModule.dispatch(DefaultModule.java:1298)", "org.labkey.api.view.ViewServlet._service(ViewServlet.java:204)", "org.labkey.api.view.ViewServlet.service(ViewServlet.java:131)", "javax.servlet.http.HttpServlet.service(HttpServlet.java:742)", "org.apache.catalina.core.ApplicationFilterChain.internalDoFilter(ApplicationFilterChain.java:231)", "org.apache.catalina.core.ApplicationFilterChain.doFilter(ApplicationFilterChain.java:166)", "org.apache.tomcat.websocket.server.WsFilter.doFilter(WsFilter.java:52)", "org.apache.catalina.core.ApplicationFilterChain.internalDoFilter(ApplicationFilterChain.java:193)", "org.apache.catalina.core.ApplicationFilterChain.doFilter(ApplicationFilterChain.java:166)", "org.labkey.api.data.TransactionFilter.doFilter(TransactionFilter.java:38)", "org.apache.catalina.core.ApplicationFilterChain.internalDoFilter(ApplicationFilterChain.java:193)", "org.apache.catalina.core.ApplicationFilterChain.doFilter(ApplicationFilterChain.java:166)", "org.labkey.api.module.ModuleLoader.doFilter(ModuleLoader.java:1225)", "org.apache.catalina.core.ApplicationFilterChain.internalDoFilter(ApplicationFilterChain.java:193)", "org.apache.catalina.core.ApplicationFilterChain.doFilter(ApplicationFilterChain.java:166)", "org.labkey.api.security.AuthFilter.doFilter(AuthFilter.java:215)", "org.apache.catalina.core.ApplicationFilterChain.internalDoFilter(ApplicationFilterChain.java:193)", "org.apache.catalina.core.ApplicationFilterChain.doFilter(ApplicationFilterChain.java:166)", "org.labkey.core.filters.SetCharacterEncodingFilter.doFilter(SetCharacterEncodingFilter.java:118)", "org.apache.catalina.core.ApplicationFilterChain.internalDoFilter(ApplicationFilterChain.java:193)", "org.apache.catalina.core.ApplicationFilterChain.doFilter(ApplicationFilterChain.java:166)", "org.apache.catalina.core.StandardWrapperValve.invoke(StandardWrapperValve.java:198)", "org.apache.catalina.core.StandardContextValve.invoke(StandardContextValve.java:96)", "org.apache.catalina.authenticator.AuthenticatorBase.invoke(AuthenticatorBase.java:496)", "org.apache.catalina.core.StandardHostValve.invoke(StandardHostValve.java:140)", "org.apache.catalina.valves.ErrorReportValve.invoke(ErrorReportValve.java:81)", "org.apache.catalina.valves.AbstractAccessLogValve.invoke(AbstractAccessLogValve.java:650)", "org.apache.catalina.core.StandardEngineValve.invoke(StandardEngineValve.java:87)", "org.apache.catalina.connector.CoyoteAdapter.service(CoyoteAdapter.java:342)", "org.apache.coyote.http11.Http11Processor.service(Http11Processor.java:803)", "org.apache.coyote.AbstractProcessorLight.process(AbstractProcessorLight.java:66)", "org.apache.coyote.AbstractProtocol$ConnectionHandler.process(AbstractProtocol.java:790)", "org.apache.tomcat.util.net.NioEndpoint$SocketProcessor.doRun(NioEndpoint.java:1468)", "org.apache.tomcat.util.net.SocketProcessorBase.run(SocketProcessorBase.java:49)", "java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1128)", "java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:628)", "org.apache.tomcat.util.threads.TaskThread$WrappingRunnable.run(TaskThread.java:61)", "java.base/java.lang.Thread.run(Thread.java:830)" ]
        };
        expect(resolveErrorMessage(error, "frog")).toBe("We could not find the frog to update.  Try refreshing your page to see if it has been deleted.");
    });

    test("Communication error", () => {
        const error = {
            exception: "Communication failure",
        };
        expect(resolveErrorMessage(error, "octopus")).toBe("There was a problem retrieving your octopus. Your session may have expired or the octopus may no longer be valid.  Try refreshing your page.");
    });
});
