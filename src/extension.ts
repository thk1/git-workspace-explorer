import * as vscode from 'vscode';
import fg from 'fast-glob';
import path from 'path';
import simpleGit from 'simple-git';

export function activate(context: vscode.ExtensionContext) {
	const treeDataProvider = vscode.window.registerTreeDataProvider('git-workspace-explorer', new GitWorkspaceProvider());
	context.subscriptions.push(treeDataProvider);
}

class GitWorkspaceProvider implements vscode.TreeDataProvider<GitWorkspace> {
	public getTreeItem(element: GitWorkspace): vscode.TreeItem {
		return element;
	}
	public async getChildren(element?: GitWorkspace | undefined): Promise<GitWorkspace[]> {
		if (element === undefined) {
			return await getGitWorkspaces();
		}
		return [];
	}
}

async function getGitWorkspaces(): Promise<GitWorkspace[]> {
	const gitdirs = (await fg.glob('/home/**/*.git', {onlyFiles: false, dot: true})).map(dir => path.dirname(dir));
	return await Promise.all(gitdirs.map(async dir => { 
		const branchName = (await simpleGit(dir).status()).current ?? '';
		return {
			uri: vscode.Uri.file(dir),
			label: path.basename(dir),
			description: branchName
		};
	}));
}

interface GitWorkspace extends vscode.TreeItem {
	uri: vscode.Uri;
}
