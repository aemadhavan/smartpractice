# Define the folders to exclude
$excludedFolders = @(".next", ".vscode", "node_modules")

# Define the output file
$outputFile = "smartpractise-structure.txt"

# Function to recursively get folder structure
function Get-FolderStructure {
    param (
        [string]$path,
        [int]$indent = 0
    )

    # Get items in the current directory
    $items = Get-ChildItem -Path $path

    foreach ($item in $items) {
        # Skip excluded folders
        if ($excludedFolders -contains $item.Name) {
            continue
        }

        # Indentation for tree structure
        $indentString = " " * $indent

        # Output the current item
        if ($item.PSIsContainer) {
            # Directory
            Write-Output ("{0}+--{1}\" -f $indentString, $item.Name)
            # Recursively get subdirectory structure
            Get-FolderStructure -path $item.FullName -indent ($indent + 4)
        } else {
            # File
            Write-Output ("{0}|--{1}" -f $indentString, $item.Name)
        }
    }
}

# Start the folder structure retrieval
Get-FolderStructure -path "." | Out-File -FilePath $outputFile -Encoding utf8
