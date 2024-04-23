import os

def delete_duplicates(directory):
    files = os.listdir(directory)
    files_dict = {}

    # Create a dictionary where the key is the filename without the date
    # and the value is the full filename
    for file in files:
        print('file: ', file)
        filename = file
        if '-' in filename:
            name_parts = filename.split('-')
            date = int(''.join(name_parts[:3]))  # Convert yyyy, mm, dd to a number
            name = '-'.join(name_parts[3:])
            print(name, date)
            if name not in files_dict or date > files_dict[name][0]:
                files_dict[name] = (date, file)

    # Delete all files except the latest one for each filename
    for name, (_, latest_file) in files_dict.items():
        for file in files:
            # print('latest file', latest_file, 'file', file, )
            if file != latest_file and file.endswith(name):
                print('delete', file)
                os.remove(os.path.join(directory, file))

# Example usage
directory_path = "assets/images/scores"
delete_duplicates(directory_path)
