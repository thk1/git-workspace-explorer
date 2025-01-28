# Git Workspace Explorer

This is an extension for Visual Studio Code.
It lists all Git repositories from a configurable set of base directories in the activity bar.
You can open those repositories as a workspace in VS Code via a single click.
The current branch name is shown next to the directory name which can be useful if you have multiple working copies of the same project.

## Usage

First configure at least one base directory via the extensions setting `gitWorkspaceExplorer.baseDirectories`.
After reloading the window, all Git repositories from those base directories (recursively) will be shown in the activity bar.

## License

This work is licensed under the [MIT license](LICENSE.md).
