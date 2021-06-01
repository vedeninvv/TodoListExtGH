import * as vscode from 'vscode';
import { TaskStorage } from './TaskStorage';

export class TodoPanel {
  public static currentPanel: TodoPanel | undefined;

  public static readonly viewType = 'TodoList';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _taskStorage: TaskStorage;

  public static createOrShow(extensionUri: vscode.Uri, taskStorage: TaskStorage) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (TodoPanel.currentPanel) {
      TodoPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      TodoPanel.viewType,
      'Todo List',
      column || vscode.ViewColumn.One,
      getWebviewOptions(extensionUri),
    );

    TodoPanel.currentPanel = new TodoPanel(panel, extensionUri, taskStorage);
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, taskStorage: TaskStorage) {
    TodoPanel.currentPanel = new TodoPanel(panel, extensionUri, taskStorage);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, taskStorage: TaskStorage) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._taskStorage = taskStorage;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      e => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'addTask':
            this._taskStorage.writeTask(message.text);
            this._update();
            return;
          case 'deleteTask':
            this._taskStorage.delete(message.text);
            this._update();
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public dispose() {
    TodoPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;

    this._panel.webview.html = this._getHtmlForWebview(webview, this._taskStorage);
  }

  private _getHtmlForWebview(webview: vscode.Webview, taskStorage: TaskStorage) {
    // Local path to main script run in the webview
    const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js');

    // And the uri we use to load this script in the webview
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

    // Local path to css styles
    const styleResetPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'webviewStyle.css');

    // Uri to load styles into webview
    const stylesResetUri = webview.asWebviewUri(styleResetPath);

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    let tasks = taskStorage.readAllTasks();
    let stringTasks: string = "";
    for (let i = 0; i < tasks.length; i++){
      stringTasks += "<li>" + tasks[i].toString() + "</li><a href=\"#\" class=\"mark\">&#10004;</a>";
    }

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${stylesResetUri}" rel="stylesheet">
				<title>Todo List</title>
			</head>
			<body>
				<h1>Todo List</h1>  
          <div class="input_div">
            <input type="text" placeholder="I must do...">
            <button type="button" id="addButton">Add</button>
          </div>
        <div class="tasks-block">
          <ul class="border" id="task-container">
            ${stringTasks}
          </ul>
        </div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}

export function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
  return {
    // Enable javascript in the webview
    enableScripts: true,

    // And restrict the webview to only loading content from our extension's `media` directory.
    localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
  };
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}