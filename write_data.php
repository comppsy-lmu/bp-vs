<?php
// get the data from the POST message
$post_data = json_decode(file_get_contents('php://input'), true);
$data = $post_data['filedata'] ?? '';

// determine suffix based on presence of prefix
$suffix = isset($post_data['prefix']) ? '-partial' : '-main';

// generate a unique ID for the file
$file = uniqid("session-", true) . $suffix;

$folderPath = 'data';
if (!is_dir($folderPath)) {
	// Create the folder
	if (!mkdir($folderPath, 0777, true)) {
		http_response_code(500);
		exit('Failed to create folder.');
	}
}

// build the full file path
$name = "./data/{$file}.csv";

// write the file to disk
if (file_put_contents($name, $data) === false) {
	http_response_code(500);
	exit('Failed to write file.');
}

echo 'File saved successfully.';
?>