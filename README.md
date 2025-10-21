# String Management API

A RESTful API for storing, querying, and managing strings with automatic property analysis including palindrome detection, character frequency analysis, and SHA-256 hashing.

## Features

- Store strings with automatic property extraction
- Query strings by multiple criteria (palindromes, length, word count, character presence)
- Natural language query support for common searches
- SHA-256 hash generation for each string
- Character frequency analysis
- Soft deletion support

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
npm install express
```

### Running the Server

```bash
node server.js
```

The server will start on port 3000.

## API Endpoints

### 1. Create a String

**POST** `/strings`

Stores a new string and returns its analyzed properties.

**Request Body:**
```json
{
  "value": "racecar"
}
```

**Response (201):**
```json
{
  "id": "sha256_hash_here",
  "value": "racecar",
  "properties": {
    "length": 7,
    "is_palindrome": true,
    "unique_characters": 4,
    "word_count": 1,
    "sha256_hash": "sha256_hash_here",
    "character_frequency_map": {
      "r": 2,
      "a": 2,
      "c": 2,
      "e": 1
    }
  },
  "created_at": "2025-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `400` - Missing value
- `409` - String already exists
- `422` - Value is not a string

### 2. Get a Specific String

**GET** `/strings/:string`

Retrieves a stored string by its exact value.

**Response (200):**
```json
{
  "id": "sha256_hash_here",
  "value": "racecar",
  "properties": { ... },
  "created_at": "2025-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `404` - String not found or deleted

### 3. Query Strings with Filters

**GET** `/strings?[filters]`

Retrieves strings matching specified criteria.

**Query Parameters:**
- `is_palindrome` (string): "true" or "false"
- `min_length` (number): Minimum string length
- `max_length` (number): Maximum string length
- `word_count` (number): Exact word count
- `contains_character` (string): Single character to search for (case-insensitive)

**Example Requests:**
```
GET /strings?is_palindrome=true
GET /strings?min_length=5&max_length=10
GET /strings?word_count=2&contains_character=a
GET /strings?is_palindrome=true&contains_character=z
```

**Response (200):**
```json
{
  "data": [ ... ],
  "count": 5,
  "filters_applied": {
    "is_palindrome": "true",
    "min_length": "5"
  }
}
```

**Error Responses:**
- `400` - Invalid query parameter values or types

### 4. Natural Language Query

**GET** `/strings/filter-by-natural-language?query=[query]`

Query strings using predefined natural language phrases.

**Supported Queries:**
- `all single word palindromic strings`
- `strings longer than 10 characters`
- `palindromic strings that contain the first vowel`
- `strings containing the letter z`
- `palindromic strings`

**Example Request:**
```
GET /strings/filter-by-natural-language?query=palindromic%20strings
```

**Response (200):**
```json
{
  "data": [ ... ],
  "count": 3,
  "interpreted_query": {
    "original": "palindromic strings",
    "parsed_filters": {
      "is_palindrome": true
    }
  }
}
```

**Error Responses:**
- `400` - Unable to parse natural language query

### 5. Delete a String

**DELETE** `/strings/:string`

Soft deletes a string from the system.

**Response:**
- `204` - Successfully deleted

**Error Responses:**
- `400` - Missing string parameter
- `404` - String not found or already deleted
- `422` - Invalid string type

## String Properties

Each stored string is analyzed and assigned the following properties:

- **length**: Total character count
- **is_palindrome**: Whether the string reads the same forwards and backwards (case-sensitive)
- **unique_characters**: Number of distinct characters
- **word_count**: Number of words (whitespace-separated)
- **sha256_hash**: Unique hash identifier
- **character_frequency_map**: Object mapping each character to its occurrence count

## Examples

### Storing and Querying Palindromes

```bash
# Store a palindrome
curl -X POST http://localhost:3000/strings \
  -H "Content-Type: application/json" \
  -d '{"value": "racecar"}'

# Query all palindromes
curl http://localhost:3000/strings?is_palindrome=true

# Use natural language
curl "http://localhost:3000/strings/filter-by-natural-language?query=palindromic%20strings"
```

### Complex Queries

```bash
# Find palindromes containing 'a' with exactly 1 word
curl "http://localhost:3000/strings?is_palindrome=true&contains_character=a&word_count=1"

# Find strings between 5-10 characters
curl "http://localhost:3000/strings?min_length=5&max_length=10"
```

## Notes

- Palindrome detection is case-sensitive for the stored value
- Character searching in queries is case-insensitive
- Deleted strings are soft-deleted and cannot be recreated
- Duplicate strings cannot be stored
- Word count calculation normalizes whitespace

## License

MIT