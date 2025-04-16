// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-grails" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('vscode-grails.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from vscode-grails!');
	});

	context.subscriptions.push(disposable);

    // 尋找對應的檔案
    const findDomainFile = (dirPath: string, targetFileName: string): string | null => {
        const files = fs.readdirSync(dirPath);

        for (const file of files) {
            const fullPath = path.join(dirPath, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // 遞迴搜尋子目錄
                const found = findDomainFile(fullPath, targetFileName);
                if (found) {
                    return found;
                }
            } else if (file === targetFileName) {
                return fullPath;
            }
        }
        return null;
    };

    let openDomain = vscode.commands.registerCommand('vscode-grails.openDomain', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const currentFilePath = editor.document.uri.fsPath;
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);

        if (!workspaceFolder) {
            return;
        }

        const domainBasePath = path.join(workspaceFolder.uri.fsPath, 'grails-app', 'domain');
        const fileName = path.basename(currentFilePath);

        // 從檔名取得 Domain 類別名稱
        let domainClassName = fileName;
        if (fileName.endsWith('Controller.groovy')) {
            domainClassName = fileName.replace('Controller.groovy', '.groovy');
        } else if (fileName.endsWith('Service.groovy')) {
            domainClassName = fileName.replace('Service.groovy', '.groovy');
        }

        const domainFile = findDomainFile(domainBasePath, domainClassName);

        if (domainFile) {
            const document = await vscode.workspace.openTextDocument(domainFile);
            await vscode.window.showTextDocument(document);
        } else {
            vscode.window.showInformationMessage(`找不到對應的 Domain 類別: ${domainClassName}`);
        }
    });

    let openController = vscode.commands.registerCommand('vscode-grails.openController', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const currentFilePath = editor.document.uri.fsPath;
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);

        if (!workspaceFolder) {
            return;
        }

        const controllerBasePath = path.join(workspaceFolder.uri.fsPath, 'grails-app', 'controllers');
        const fileName = path.basename(currentFilePath);

        // 取得 Controller 類別名稱
        let controllerClassName = fileName.replace('.groovy', 'Controller.groovy');
        if (fileName.endsWith('Service.groovy')) {
            controllerClassName = fileName.replace('Service.groovy', 'Controller.groovy');
        }

        // 使用現有的 findDomainFile 函數邏輯來尋找檔案
        const controllerFile = findDomainFile(controllerBasePath, controllerClassName);

        if (controllerFile) {
            const document = await vscode.workspace.openTextDocument(controllerFile);
            await vscode.window.showTextDocument(document);
        } else {
            vscode.window.showInformationMessage(`找不到對應的 Controller 類別: ${controllerClassName}`);
        }
    });

    let openService = vscode.commands.registerCommand('vscode-grails.openService', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const currentFilePath = editor.document.uri.fsPath;
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
        if (!workspaceFolder) {
            return;
        }
        const serviceBasePath = path.join(workspaceFolder.uri.fsPath, 'grails-app', 'services');
        const fileName = path.basename(currentFilePath);
        // 取得 Service 類別名稱
        let serviceClassName = fileName.replace('.groovy', 'Service.groovy');
        if (fileName.endsWith('Controller.groovy')) {
            serviceClassName = fileName.replace('Controller.groovy', 'Service.groovy');
        }
        // 使用現有的 findDomainFile 函數邏輯來尋找檔案
        const serviceFile = findDomainFile(serviceBasePath, serviceClassName);
        if (serviceFile) {
            const document = await vscode.workspace.openTextDocument(serviceFile);
            await vscode.window.showTextDocument(document);
        } else {
            vscode.window.showInformationMessage(`找不到對應的 Service 類別: ${serviceClassName}`);
        }
    });

    context.subscriptions.push(openDomain);
    context.subscriptions.push(openController);
    context.subscriptions.push(openService);
}

// This method is called when your extension is deactivated
export function deactivate() {}
