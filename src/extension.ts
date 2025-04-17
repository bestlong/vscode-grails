// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// 新增載入語系檔案的功能
function loadMessages(locale: string): any {
    const messagePath = path.join(__dirname, '..', 'i18n', locale, 'messages.json');
    try {
        return JSON.parse(fs.readFileSync(messagePath, 'utf8'));
    } catch (err) {
        return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'i18n', 'en', 'messages.json'), 'utf8'));
    }
}

// 取得當前語系的訊息
function getMessage(key: string, ...args: string[]): string {
    const messages = loadMessages(vscode.env.language);
    let message = messages[key] || key;
    args.forEach((arg, index) => {
        message = message.replace(`{${index}}`, arg);
    });
    return message;
}

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

    let gotoDomain = vscode.commands.registerCommand('vscode-grails.gotoDomain', async () => {
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
            vscode.window.showInformationMessage(getMessage('grails.notFound.domain', domainClassName));
        }
    });

    let gotoController = vscode.commands.registerCommand('vscode-grails.gotoController', async () => {
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
        let controllerClassName;
        if (fileName.endsWith('.gsp')) {
            // 如果是 .gsp 檔案，從路徑取得 controller 名稱和 view 名稱
            const viewsPath = path.join(workspaceFolder.uri.fsPath, 'grails-app', 'views');
            const relativePath = path.relative(viewsPath, path.dirname(currentFilePath));
            const controllerName = relativePath.split(path.sep)[0];
            controllerClassName = `${controllerName.charAt(0).toUpperCase() + controllerName.slice(1)}Controller.groovy`;

            // 取得不含副檔名的當前檔案名稱作為方法名稱
            const methodName = path.basename(currentFilePath, '.gsp');

            // 找到對應的 Controller 檔案
            const controllerFile = findDomainFile(controllerBasePath, controllerClassName);

            if (controllerFile) {
                const document = await vscode.workspace.openTextDocument(controllerFile);
                await vscode.window.showTextDocument(document);

                // 找到對應的方法位置
                const text = document.getText();
                const methodRegex = new RegExp(`def\\s+${methodName}\\s*\\(`);
                const match = text.match(methodRegex);

                if (match) {
                    // 計算方法在文件中的位置
                    const position = document.positionAt(match.index!);

                    // 移動編輯器到對應的方法
                    const editor = await vscode.window.showTextDocument(document);
                    editor.selection = new vscode.Selection(position, position);
                    editor.revealRange(
                        new vscode.Range(position, position),
                        vscode.TextEditorRevealType.InCenter
                    );
                }
            } else {
                vscode.window.showInformationMessage(getMessage('grails.notFound.controller', controllerClassName));
            }
            return;
        } else {
            controllerClassName = fileName.replace('.groovy', 'Controller.groovy');
            if (fileName.endsWith('Service.groovy')) {
                controllerClassName = fileName.replace('Service.groovy', 'Controller.groovy');
            }
        }

        // 使用現有的 findDomainFile 函數邏輯來尋找檔案
        const controllerFile = findDomainFile(controllerBasePath, controllerClassName);

        if (controllerFile) {
            const document = await vscode.workspace.openTextDocument(controllerFile);
            await vscode.window.showTextDocument(document);
        } else {
            vscode.window.showInformationMessage(getMessage('grails.notFound.controller', controllerClassName));
        }
    });

    let gotoService = vscode.commands.registerCommand('vscode-grails.gotoService', async () => {
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
            vscode.window.showInformationMessage(getMessage('grails.notFound.service', serviceClassName));
        }
    });

    let gotoView = vscode.commands.registerCommand('vscode-grails.gotoView', async () => {
        // 獲取當前編輯器
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        // 確保當前檔案是 Controller
        const currentFile = editor.document.fileName;
        if (!currentFile.endsWith('Controller.groovy')) {
            vscode.window.showErrorMessage(getMessage('grails.error.notController'));
            return;
        }

        // 解析 Controller 名稱
        const fileName = path.basename(currentFile);
        const controllerName = fileName.replace('Controller.groovy', '');

        // 找到專案根目錄
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
        if (!workspaceFolder) {
            vscode.window.showErrorMessage(getMessage('grails.error.noWorkspaceFolder'));
            return;
        }

        // 從游標位置取得當前方法名稱
        const document = editor.document;
        const position = editor.selection.active;
        const text = document.getText();

        // 尋找目前游標位置的方法名稱
        const methodRegex = /def\s+(\w+)\s*\(/g;
        let currentMethod = null;
        let match;

        while ((match = methodRegex.exec(text)) !== null) {
            const methodStartPos = document.positionAt(match.index);
            const methodEndPos = document.positionAt(match.index + match[0].length);

            // 建立方法的範圍
            const methodRange = new vscode.Range(methodStartPos, methodEndPos);

            // 尋找方法的結束位置 (找到下一個 def 或檔案結尾)
            let nextMatch = methodRegex.exec(text);
            let methodBlockEndPos;
            if (nextMatch) {
                methodBlockEndPos = document.positionAt(nextMatch.index);
                methodRegex.lastIndex = match.index + match[0].length; // 重設搜尋位置
            } else {
                methodBlockEndPos = document.positionAt(text.length);
            }

            // 檢查游標是否在這個方法的範圍內
            const methodBlockRange = new vscode.Range(methodStartPos, methodBlockEndPos);
            if (methodBlockRange.contains(position)) {
                currentMethod = match[1]; // 取得方法名稱
                break;
            }
        }

        // 構建 views 目錄路徑
        const viewsPath = path.join(workspaceFolder.uri.fsPath, 'grails-app', 'views', controllerName.toLowerCase());

        // 檢查 views 目錄是否存在
        if (!fs.existsSync(viewsPath)) {
            const create = await vscode.window.showQuickPick(['是', '否'], {
                placeHolder: getMessage('grails.createViewsDirectory', viewsPath)
            });

            if (create === '是') {
                fs.mkdirSync(viewsPath, { recursive: true });
            } else {
                return;
            }
        }

        // 讀取 views 目錄中的檔案
        const files = fs.readdirSync(viewsPath).filter(file => file.endsWith('.gsp'));

        // 如果有找到當前方法名稱，優先尋找對應的 view 檔案
        if (currentMethod) {
            const matchingView = files.find(file => file === `${currentMethod}.gsp`);
            if (matchingView) {
                const doc = await vscode.workspace.openTextDocument(path.join(viewsPath, matchingView));
                await vscode.window.showTextDocument(doc);
                return;
            }
        }

        if (files.length === 0) {
            // 如果沒有 view 檔案，提供建立新檔案的選項
            const createNew = await vscode.window.showQuickPick(['是', '否'], {
                placeHolder: currentMethod
                    ? getMessage('grails.noViewForMethod', currentMethod)
                    : getMessage('grails.noViews')
            });

            if (createNew === '是') {
                const defaultName = currentMethod || '';
                const viewName = await vscode.window.showInputBox({
                    placeHolder: getMessage('grails.enterViewName'),
                    value: defaultName
                });

                if (viewName) {
                    const newViewPath = path.join(viewsPath, `${viewName}.gsp`);
                    fs.writeFileSync(newViewPath, '');
                    const doc = await vscode.workspace.openTextDocument(newViewPath);
                    await vscode.window.showTextDocument(doc);
                }
            }
            return;
        }

        // 如果有多個 view 檔案，讓使用者選擇
        const selected = await vscode.window.showQuickPick(files, {
            placeHolder: currentMethod
                ? getMessage('grails.selectViewForMethod', currentMethod)
                : getMessage('grails.selectView')
        });

        if (selected) {
            const doc = await vscode.workspace.openTextDocument(path.join(viewsPath, selected));
            await vscode.window.showTextDocument(doc);
        }
    });

    context.subscriptions.push(gotoDomain);
    context.subscriptions.push(gotoController);
    context.subscriptions.push(gotoService);
    context.subscriptions.push(gotoView);
}

// This method is called when your extension is deactivated
export function deactivate() {}
