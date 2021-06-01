import * as vscode from 'vscode';
import { TaskStorage } from './TaskStorage';
import { TodoPanel, getWebviewOptions } from './WebPanel';

export function activate(context: vscode.ExtensionContext) {
	//context.globalState.update("0", "0"); //delete this when you will want to save tasks forever
	var taskStorage = TaskStorage.create(context);

	context.subscriptions.push(
		vscode.commands.registerCommand('todolist.openTodoLists', () => {
			TodoPanel.createOrShow(context.extensionUri, taskStorage);
		})
	);

	if (vscode.window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(TodoPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				console.log(`Got state: ${state}`);
				// Reset the webview options so we use latest uri for `localResourceRoots`.
				webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
				TodoPanel.revive(webviewPanel, context.extensionUri, taskStorage);
			}
		});
	}
}