require('dotenv').config();
const express = require('express')
const superagent = require('superagent')
const pg =require('pg');
const app = express();
const PORT = process.env.PORT;
const DATABASE_URL=process.env.DATABASE_URL;
// const client = new pg.Client(DATABASE_URL)
const ENV = process.env.ENV || 'DEP';
let client = '';
if (ENV === 'DEP') {
  client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  client = new pg.Client({
    connectionString: DATABASE_URL,
  });
}

app.use(express.urlencoded({extended:true}));

app.use(express.static('public'))
app.set('view engine', 'ejs');
app.get('/test', (req, res) => {
  res.render('pages/index');
})
app.get('/searches/new', displayForm);
app.post('/searches', showBooks);
app.post('/books', selectBook);

app.get('/', renderHome);
app.get('/books/:id',bookDeatails);
function displayForm(req, res) {
  res.render('pages/searches/new')
}
function renderHome(req,res){
  const sqlQuery='SELECT * FROM booktable;';
  client.query(sqlQuery).then(results =>{
    res.render('pages/index',{results:results.rows});
  }).catch((error) => {
    handleError(error,res);
  })
}

function selectBook(req,res){
  console.log(req.body);
  const author=req.body.author;
  const title=req.body.title;
  const isbn=req.body.isbn;
  const image =req.body.img;
  const description= req.body.description;
  const value=[title,author,isbn,image,description];
  const sqlQuery='INSERT INTO booktable (title,author, isbn, image, description) VALUES($1, $2, $3,$4,$5) RETURNING id;';
  client.query(sqlQuery, value).then(()=>{
    res.redirect('/');
  }).catch(error=>{
    handleError(error,res);
  });
}

function bookDeatails(req,res){
  const bookid=req.params.id;
  const sql_query='SELECT * FROM booktable WHERE id=$1';
  const safeValues=[bookid];
  client.query(sql_query,safeValues).then(results=>{
    res.render('pages/books/details.ejs',{results:results.rows});
  }).catch(error=>{
    handleError(error,res);
  })
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
    return apiRes.body.items.map(book => new Book(book.volumeInfo))
  }).then(results => {
    res.render('pages/searches/show',{ searchResults: results })
  }).catch((error) => {
    handleError(error,res);
  })
}
function handleError(error, res) {
  res.render('pages/error', { error: error });
}
function Book(data) {
  this.title = data.title? data.title:'Title was Found';
  this.author = data.authors ? data.authors[0] :'Authors was not Found';
  this.isbn = data.industryIdentifiers ? `ISBN_13 ${data.industryIdentifiers[0].identifier}` : 'No ISBN available';
  this.description = data.description? data.description:'Description was not Found';
  this.thumbnail = data.imageLinks? data.imageLinks.thumbnail : 'https://i7.uihere.com/icons/829/139/596/thumbnail-caefd2ba7467a68807121ca84628f1eb.png';
}
client.connect().then(() =>
  app.listen(PORT, () => console.log(`Listening on port: ${PORT}`))
);

app.use('*', (req, res) => {
  res.send(`All fine, Nothing to see YET ...`)
})
