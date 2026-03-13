# ReactRadar 

![Open Source](https://img.shields.io/badge/Open%20Source-Yes-brightgreen?style=flat)
![Node.js](https://img.shields.io/badge/node-%3E=18-brightgreen?style=flat)
![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC?style=flat)
![React](https://img.shields.io/badge/React-%2320232a?style=flat&logo=react&logoColor=%2361DAFB)
![Status](https://img.shields.io/badge/status-experimental-orange?style=flat)
![Last Commit](https://img.shields.io/github/last-commit/nick7676/ReactRadar?style=flat-square)

## Description

ReactRadar is a CLI tool for analyzing React projects directly from the terminal.

It provides static analysis and runtime metrics such as component size,
render hierarchy, and performance insights.

## Build Preview 
* **Potential error detection**: TypeScript analysis and ESLint linting without running a full build.
* **Component navigation metrics**: average depth, average number of children, static parent-child relationships.

## Dynamic CLI 
* **Rendered component tracking**: which components are rendered during a React page execution.
* **Render timing**: duration of each component render.
* **Parent-child hierarchy**: mapping of rendered components and their parents.
* **Component weight**: estimation of the size of rendered components.
* **CLI output**: display data in a table.

## Libraries
* **Yargs**: Main CLI library
* **Chalk v.4**: CLI colors
* **cli-table3**: CLI table
  
## TODO

* [x] Component Line Scanner
* [ ] Build errors/ESlint preview
* [ ] Ability to pass arguments (filters)
* [x] Component navigation metrics
* [ ] Render timing
* [ ] Rendered component tracking
* [ ] Component rendered weight
* [ ] Wiki
* [x] Npm relase

## Usage

Global installation:

```bash
npm install -g react-radar
```

Run from the root of a React project:

```bash
# scan component files by lines
react-radar analyze 

# inspect static parent–child relationships
react-radar parents 
```


## Author's Note

This is my first project in the **Node.js** ecosystem and my first **Open Source** initiative of this technical complexity, so expect big errors and problems.

---
