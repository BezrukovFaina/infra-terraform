/**
 * parser.js
 *
 * This module provides functions for parsing infrastructure definition files,
 * specifically those written in a custom format for Terraform configuration.
 */

const fs = require('fs');
const path = require('path');
const { validate } = require('./validator'); // Assuming a validator module exists

/**
 * Parses an infrastructure definition file.
 *
 * @param {string} filePath The path to the infrastructure definition file.
 * @returns {object} The parsed infrastructure definition as a JavaScript object.
 * @throws {Error} If the file cannot be read, parsed, or is invalid.
 */
function parseFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const parsedObject = JSON.parse(fileContent); // Assuming JSON format for simplicity

    // Validate the parsed object against a schema.
    const validationResult = validate(parsedObject);

    if (!validationResult.isValid) {
      throw new Error(`Infrastructure definition file "${filePath}" is invalid:\n${validationResult.errors.join('\n')}`);
    }

    return parsedObject;

  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    } else if (error instanceof SyntaxError) {
      throw new Error(`Error parsing JSON in file "${filePath}": ${error.message}`);
    } else {
      throw error; // Re-throw other errors
    }
  }
}

/**
 * Recursively parses all infrastructure definition files in a directory.
 *
 * @param {string} directoryPath The path to the directory containing the infrastructure definition files.
 * @param {string} fileExtension The file extension to filter for (e.g., '.json').
 * @returns {object[]} An array of parsed infrastructure definitions as JavaScript objects.
 * @throws {Error} If any file cannot be read, parsed, or is invalid.
 */
function parseDirectory(directoryPath, fileExtension = '.json') {
  const parsedDefinitions = [];

  const files = fs.readdirSync(directoryPath);

  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const fileStat = fs.statSync(filePath);

    if (fileStat.isDirectory()) {
      // Recursively parse files in subdirectories
      parsedDefinitions.push(...parseDirectory(filePath, fileExtension));
    } else if (filePath.endsWith(fileExtension)) {
      try {
        const parsedDefinition = parseFile(filePath);
        parsedDefinitions.push(parsedDefinition);
      } catch (error) {
        throw new Error(`Error parsing file "${filePath}": ${error.message}`);
      }
    }
  }

  return parsedDefinitions;
}

module.exports = {
  parseFile,
  parseDirectory,
};