import * as vscode from 'vscode';
import fg from 'fast-glob';
import path from 'path';
import simpleGit from 'simple-git';

export function activate(context: vscode.ExtensionContext) {
	const gitWorkspaceProvider = new GitWorkspaceProvider();
	context.subscriptions.push(vscode.window.registerTreeDataProvider('git-workspace-explorer', gitWorkspaceProvider));
}

class GitWorkspaceProvider implements vscode.TreeDataProvider<GitWorkspace> {
	public getTreeItem(element: GitWorkspace): vscode.TreeItem {
		return element;
	}
	public async getChildren(element?: GitWorkspace | undefined): Promise<GitWorkspace[]> {
		return element === undefined ? await getGitWorkspaces() : [];
	}
}

function getBaseDirectories(): vscode.Uri[] {
	const dirs = vscode.workspace.getConfiguration('git-workspace-explorer').get<string[]>('base-directories') ?? [];
	return dirs.map(dir => vscode.Uri.file(dir));
}

async function getGitWorkspaces(): Promise<GitWorkspace[]> {
	const baseDirs = getBaseDirectories();
	const globOptions = { onlyFiles: false, dot: true, suppressErrors: true };
	const gitdirs = (await Promise.all(baseDirs.map(async baseDir => await fg.glob(`${baseDir.fsPath}/**/.git`, globOptions)))).flat();
	return await Promise.all(gitdirs.map(async dir => await createGitWorkspace(dir)));
}

async function getBranchName(dir: string): Promise<string | undefined> {
	try {
		const name = (await simpleGit(dir).revparse('--abbrev-ref HEAD')).trim();
		return name !== '' ? name : undefined;
	} catch (_) {
		return undefined;
	}
}

async function createGitWorkspace(gitdir: string): Promise<GitWorkspace> {
	const dir = path.dirname(gitdir);
	const branchName = await getBranchName(dir) ?? '';
	const tooltip = `Open ${dir}`;
	const command: vscode.Command = {
		title: 'Open workspace',
		command: 'vscode.openFolder',
		tooltip: tooltip,
		arguments: [vscode.Uri.file(dir)]
	};
	return {
		uri: vscode.Uri.file(dir),
		label: path.basename(dir),
		iconPath: vscode.ThemeIcon.Folder,
		tooltip: tooltip,
		description: branchName,
		command: command
	};
}

interface GitWorkspace extends vscode.TreeItem {
	uri: vscode.Uri;
}
