require('dotenv').config();
const express = require('express')
const superagent = require('superagent')
const app = express()
const PORT = process.env.PORT
app.use(express.urlencoded());
app.use(express.static('public'))
app.set('view engine', 'ejs');
app.get('/test', (req, res) => {
  res.render('pages/index');
})
app.get('/searches/new', displayForm)
app.post('/searches', showBooks)
function displayForm(req, res) {
  res.render('pages/searches/new')
}
function showBooks(req, res) {
  let urlBooks = `https://www.googleapis.com/books/v1/volumes`
  const searchBy = req.body.searchBy
  const searchByVl = req.body.search
  const queryObj = {}
  if(searchBy === 'title') {
    queryObj['q'] = `+intitle:'${searchByVl}'`
  }else if(searchBy === 'author') {
    queryObj['q'] = `+inauthor:'${searchByVl}'`
  }
  superagent.get(urlBooks).query(queryObj).then(apiRes => {
    console.log(apiRes.body.items);
    return apiRes.body.items.map(book => new Book(book.volumeInfo))
  }).then(results => {
    res.render('pages/searches/show',{ searchResults: results })
  }).catch((error) => { 
    res.status(500).render('pages/error');
  });
}

function Book(data) {
  this.title = data.title;
  this.author = data.authors;
  this.description = data.description;
//   this.thumbnail = data.imageLinks.thumbnail || `https://i.imgur.com/J5LVHEL.jpg`;
}
app.listen(PORT, () => {
  console.log(`listening to PORT ${PORT}....`);
})
app.use('*', (req, res) => {
  res.send(`All fine, Nothing to see YET ...`)
})
