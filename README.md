# Pluralsight Code Sample

## Running

To run the app, first go into backend and run `yarn start` to start the api server on `localhost:5000`. Then go into frontend and run `yarn start` to start the gui on `localhost:3000`. 

## Features

### Pagination

Pagination is handled by `offset` and `size` parameters to the query api. The frontend manages determining what these parameters should be to produce pages of data.

### Sorting

Sorting is determined by the `sort` parameter, which has sub properties `key` and `order`. The frontend determines which sort parameters to send based on which of the column headers has been clicked. Clicking a column header a second time reverses the order.

### Filtering

Filtering is determined by the `filter` parameter, which can contain keys for any column. These keys should map to filtering values, which serve slightly different purposes depending on the column.

* Because the question is a text field, filter is a simple case insensitive matching string; if the filter is contained in the question it will match.

* Because answer is numeric, filter acts as an exact numeric matching. THis behavior is currently determined purely by the type of the value in the column.

* Distractors are also treated as numeric, but a row will match a distractor filter if any distractor in the array matches the filter.

### Other Operations

I had hoped to also get to create, delete and edit, but I didn't feel that I had time to implement them properly. That being said, there are stubs of the implementations in the code base, blocked off from use by the express routes throwing the error Not Implemented if they are accessed.