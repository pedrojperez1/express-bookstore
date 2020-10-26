const request = require("supertest");
const app = require("../app");
const db = require("../db");

process.env.NODE_ENV = "test";

let testBook;
beforeEach(async () => {
    await db.query(`DELETE FROM books`);
    const queryParams = [
        "987654321",
        "www.amazon.com",
        "Test Author",
        "test",
        456,
        "Test Publisher",
        "Title",
        1900
    ];
    const results = await db.query(`
        INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING isbn, amazon_url, author, language, pages, publisher, title, year
    `, queryParams);
    testBook = results.rows[0];
});

afterAll(async function() {
    await db.end();
});

describe("GET /books should respond with list of all books", () => {
    test("Route should return all books.", async () => {
        const resp = await request(app).get("/books");
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({books: [testBook]});
    });
});

describe("POST /books create a book and respond with newly created book", () => {
    test("Route should return the newly created book when valid data is provided", async () => {
        const book = {
            "isbn": "123456789",
            "amazon_url": "http://www.amazon.com/",
            "author": "Rey The Dogge",
            "language": "english",
            "pages": 123,
            "publisher": "Test Publisher",
            "title": "Test Title",
            "year": 2020
        };
        const resp = await request(app).post("/books").send(book);
        expect(resp.statusCode).toBe(201);
        expect(resp.body).toEqual({book});
        const allBooks = await request(app).get("/books");
        expect(allBooks.body).toEqual({books: [book, testBook]});
    });
    test("Route should return bad request 400 if json is missing property", async () => {
        const book = {
            "isbn": "123456789",
            "amazon_url": "http://www.amazon.com/",
            //"author": "Rey The Dogge",
            "language": "english",
            "pages": 123,
            "publisher": "Test Publisher",
            "title": "Test Title",
            "year": 2020
        };
        const resp = await request(app).post("/books").send(book);
        expect(resp.statusCode).toBe(400);
    });
    test("Route should return bad request 400 if json propety is wrong type", async () => {
        const book = {
            "isbn": 123456789, //wrong type
            "amazon_url": "http://www.amazon.com/",
            "author": "Rey The Dogge",
            "language": "english",
            "pages": 123,
            "publisher": "Test Publisher",
            "title": "Test Title",
            "year": 2020
        };
        const resp = await request(app).post("/books").send(book);
        expect(resp.statusCode).toBe(400);
    });
});

describe("GET /books/:isbn should respond with single book", () => {
    test("Route should return single book.", async () => {
        const resp = await request(app).get(`/books/${testBook.isbn}`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({book: testBook});
    });
});

describe("PUT /books/:isbn should update record of single book", () => {
    test("Route should update single book and return new book data", async () => {
        const newBook = {
            "isbn": "987654321",
            "amazon_url": "http://www.amazon.com/",
            "author": "Rey The Dogge",
            "language": "english",
            "pages": 123,
            "publisher": "Test Publisher",
            "title": "Test Title",
            "year": 2020
        };
        const resp = await request(app).put(`/books/${testBook.isbn}`).send(newBook)
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({book: newBook});
    });
    test("Route should return 400 bad request if json missing properties", async () => {
        const newBook = {
            "isbn": "987654321",
            "amazon_url": "http://www.amazon.com/",
            // "author": "Rey The Dogge",
            // "language": "english",
            "pages": 123,
            "publisher": "Test Publisher",
            "title": "Test Title",
            "year": 2020
        };
        const resp = await request(app).put(`/books/${testBook.isbn}`).send(newBook)
        expect(resp.statusCode).toBe(400);
    });
    test("Route should return 400 bad request if json properties are incorrect type", async () => {
        const newBook = {
            "isbn": "987654321",
            "amazon_url": "http://www.amazon.com/",
            "author": "Rey The Dogge",
            "language": "english",
            "pages": "123", // incorrect type (expected integer)
            "publisher": "Test Publisher",
            "title": false, // incorrect type (expected string)
            "year": 2020
        };
        const resp = await request(app).put(`/books/${testBook.isbn}`).send(newBook)
        expect(resp.statusCode).toBe(400);
    });
});

describe("DELETE /books/:isbn should delete single book", () => {
    test("Route should delete single book from db", async () => {
        const resp = await request(app).delete(`/books/${testBook.isbn}`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({message: "Book deleted"});
    })
});