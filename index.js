import express from "express"
import crypto from "crypto"

const port = 3000
const app = express()

const stringStore = {}

app.use(express.json())

const exampleQueries = [
  "all single word palindromic strings", 
  "strings longer than 10 characters",
  "palindromic strings that contain the first vowel",
  "strings containing the letter z",
  "palindromic strings"
]

const verifyString = (req, res, next) => {
  const { value } = req.body

  if (!value) {
    return res.sendStatus(400)
  }

  if (typeof value !== "string") {
    return res.sendStatus(422)
  }

  if (value in stringStore && stringStore[value] !== "deleted") {
    return res.sendStatus(409)
  }

  next()
}

const validateQuery = (req, res, next) => {
  const { query } = req;

  if (query.is_palindrome && (query.is_palindrome !== "true" && query.is_palindrome !== "false")) {
    console.log("palindrome issue")
    return res.status(400).send("Invalid query parameter values or types")
  }

  if (query.min_length && !Number(query.min_length)) {
    console.log("minlength issue")
    return res.status(400).send("Invalid query parameter values or types")
  }

  if (query.max_length && !Number(query.max_length)) {
    console.log("maxlength issue")
    return res.status(400).send("Invalid query parameter values or types")
  }

  if (query.word_count && !Number(query.word_count)) {
    console.log("word count issue")
    return res.status(400).send("Invalid query parameter values or types")
  }

  if (query.contains_character && (query.contains_character.length !== 1 || typeof query.contains_character !== "string")) {
    console.log("includes charcter issue")
    return res.status(400).send("Invalid query parameter values or types")
  }

  next()
}

const verifyStringToDelete = (req, res, next) => {

  const { string } = req.params

  if (!string) {
    return res.sendStatus(400)
  }

  if (typeof string !== "string") {
    return res.sendStatus(422)
  }

  if (!(string in stringStore) || stringStore[string] === "deleted") {
    return res.status(404).send("String does not exist in the system")
  }

  next()
}

const queryStringStore = (query) => {
  const data = []
  const { 
    is_palindrome,
    min_length = 0,
    max_length = Infinity,
    word_count,
    contains_character = ""
   } = query

  for (let [key, value] of Object.entries(stringStore)) {
    value = value.properties

    if (is_palindrome !== undefined) {
      if (JSON.parse(is_palindrome) !== value.is_palindrome) continue;
    }

    if (min_length > key.length || max_length < key.length) continue

    if (word_count) {
      if (Number(word_count) !== key.split(" ").length) continue
    }

    if (contains_character) {
      if (!key.split('').includes(contains_character.toLowerCase())) continue
    }

    data.push(stringStore[key])
  }

  return data
}

app.post("/strings", verifyString, (req, res) => {
  const { value } = req.body

  const characterFrequencyMap = {}

  const isPalindrome = value.toLowerCase().split("").reverse().join("") === value
  const hashed = crypto.createHash("sha256").update(value).digest("hex")

  for (let letter of value) {
    characterFrequencyMap[letter] = (characterFrequencyMap[letter] || 0) + 1
  }



  const properties = {
    length: value.length,
    is_palindrome: isPalindrome,
    unique_characters: Object.keys(characterFrequencyMap).length,
    word_count: value.trim().replace(/\s+/g, ' ').split(" ").length,
    sha256_hash: hashed,
    character_frequency_map: characterFrequencyMap,
  }

  stringStore[value] = {
    id: hashed,
    value,
    properties,
    created_at: new Date()
  }

  return res.status(201).json(stringStore[value])
})

app.get("/strings/filter-by-natural-language", (req, res) => {

  const { query } = req.query

  const parsed_filters = {
    "all single word palindromic strings": {
      word_count: 1,
      is_palindrome: true
    },
    "strings longer than 10 characters": {
      min_length: 11
    },
    "palindromic strings that contain the first vowel": {
      is_palindrome: true,
      contains_character: "a"
    },
    "strings containing the letter z": {
      contains_character: "z"
    },
    "palindromic strings": {
      is_palindrome: true
    }
  }

  if (!exampleQueries.includes(query)) {
    return res.status(400).json({ error: "Unable to parse natural language query" })
  }

  const data = queryStringStore(parsed_filters[query])

  return res.status(200).json({
    data,
    count: data.length,
    interpreted_query: {
      original: query,
      parsed_filters: parsed_filters[query]
    }
  })

})

app.get("/strings/:string", (req, res) => {
  const { string } = req.params

  const hashed = crypto.createHash("sha256").update(string).digest("hex")

  if (string in stringStore && stringStore[string] !== "deleted") {
    return res.status(200).json({
      id: hashed,
      value: string,
      properties: stringStore[string],
      created_at: new Date()
    })
  } else {
    return res.status(404).send("String does not exist in the system")
  }
})

app.get("/strings", validateQuery, (req, res) => {
  
  const data = queryStringStore(req.query)

  return res.status(200).json({
    data,
    count: data.length,
    filters_applied: req.query
  })

})

app.delete("/strings/:string", verifyStringToDelete, (req, res) => {

  const { string } = req.params
  stringStore[string] = "deleted"
  return res.sendStatus(204)

  
})

app.listen(port, () => {
  console.log(`Server running on port ${port}...`)
})
