import * as vscode from 'vscode';
import fg from 'fast-glob';
import path from 'path';
import simpleGit from 'simple-git';

// Global state key under which discovered workspaces are cached.
const STORAGE_KEY = 'workspaces';

export function activate(context: vscode.ExtensionContext) {
	const gitWorkspaceProvider = new GitWorkspaceProvider(context.globalState);
	context.subscriptions.push(vscode.window.registerTreeDataProvider('git-workspace-explorer', gitWorkspaceProvider));
	context.subscriptions.push(vscode.commands.registerCommand('gitWorkspaceExplorer.refresh', () => {
		refresh(context.globalState, gitWorkspaceProvider);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('gitWorkspaceExplorer.configure', () => {
		vscode.commands.executeCommand('workbench.action.openSettings', '@ext:thk1.git-workspace-explorer');
	}));
	vscode.workspace.onDidChangeConfiguration(event => {
		if (event.affectsConfiguration('gitWorkspaceExplorer')) {
			refresh(context.globalState, gitWorkspaceProvider);
			updateContext();
		}
	});
	void refresh(context.globalState, gitWorkspaceProvider);
	updateContext();
}

class GitWorkspaceProvider implements vscode.TreeDataProvider<GitWorkspace> {
	private onDidChangeTreeDataEmitter = new vscode.EventEmitter<void>();
	public onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;
	public constructor(private readonly storage: vscode.Memento) {}
	public refresh() {
		this.onDidChangeTreeDataEmitter.fire();
	}
	public getTreeItem(workspace: GitWorkspace): vscode.TreeItem {
		const tooltip = `Open ${workspace.path}`;
		const command: vscode.Command = {
			title: 'Open workspace',
			command: 'vscode.openFolder',
			tooltip: tooltip,
			arguments: [vscode.Uri.file(workspace.path)]
		};
		return {
			label: path.basename(workspace.path),
			iconPath: vscode.ThemeIcon.Folder,
			tooltip: tooltip,
			description: workspace.branchName,
			command: command
		};
	}
	public async getChildren(element?: GitWorkspace | undefined): Promise<GitWorkspace[]> {
		return element === undefined ? this.storage.get<GitWorkspace[]>(STORAGE_KEY) ?? [] : [];
	}
}

async function refresh(storage: vscode.Memento, gitWorkspaceProvider: GitWorkspaceProvider) {
	const workspaces = await findGitWorkspaces();
	workspaces.sort(compareGitWorkspaces);
	storage.update(STORAGE_KEY, workspaces);
	gitWorkspaceProvider.refresh();
}

async function updateContext(): Promise<void> {
	await vscode.commands.executeCommand('setContext', 'gitWorkspaceExplorer.hasBaseDirectories', getBaseDirectories().length > 0);
}

function getBaseDirectories(): string[] {
	return vscode.workspace.getConfiguration('gitWorkspaceExplorer').get<string[]>('baseDirectories') ?? [];
}

function getScanDepth(): number | undefined {
	const depth = vscode.workspace.getConfiguration('gitWorkspaceExplorer').get<number>('scanDepth') ?? -1;
	// the .git directory we're looking for is one layer below the actual workspace
	const realDepth = depth + 1;
	return realDepth > 0 ? realDepth : undefined;
}

async function findGitWorkspaces(): Promise<GitWorkspace[]> {
	const baseDirs = getBaseDirectories();
	const scanDepth = getScanDepth();
	const globOptions: fg.Options = { onlyFiles: false, dot: true, suppressErrors: true, deep: scanDepth };
	const gitdirs = (await Promise.all(baseDirs.map(async baseDir => await fg.glob(`${baseDir.replace('\\', '/')}/**/.git`, globOptions)))).flat();
	return await Promise.all(gitdirs.map(async dir => await createFromGitdir(dir)));
}

async function getBranchName(dir: string): Promise<string | undefined> {
	try {
		const name = (await simpleGit(dir).revparse(['--abbrev-ref', 'HEAD'])).trim();
		return name !== '' ? name : undefined;
	} catch (_) {
		return undefined;
	}
}

async function createFromGitdir(gitdir: string): Promise<GitWorkspace> {
	const dir = path.dirname(gitdir);
	return { path: dir, branchName: await getBranchName(dir) ?? ''};
}

interface GitWorkspace {
	path: string;
	branchName: string;
}

function compareGitWorkspaces(left: GitWorkspace, right: GitWorkspace): number {
	const order = left.path.toString().localeCompare(right.path.toString());
	return order !== 0 ? order : left.branchName.toString().localeCompare(right.branchName.toString());
}
