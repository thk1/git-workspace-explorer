# Git Workspace Explorer

This is an extension for Visual Studio Code.
It lists all git repositories from a configurable set of base directories in the activity bar.
You can open those repositories as a workspace in VS Code via a single click.
The current branch name is shown next to the directory name which can be useful if you have multiple working copies of the same project.

## Usage

First configure our base directories via the extensions setting `git-workspace-explorer.base-directories`.
After reloading the window, all git repositories from those base directories (recursively) will be shown in the activity bar.

## Bugs

This extension is in an early stage of development.
Please do not report any issues, yet.

## License

This work is licensed under the [MIT license](LICENSE.md).