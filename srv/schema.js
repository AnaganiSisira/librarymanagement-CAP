const cds = require('@sap/cds');
const { UPDATE } = require('@sap/cds/lib/ql/cds-ql');

module.exports = cds.service.impl(async function () {
    const { Books, BookCopies, BorrowingInfo } = cds.entities;

    this.before('CREATE', 'BorrowingInfo', async (req) => {
        const { bookCopy_ID, borrowDate, dueDate } = req.data;

        if (!borrowDate || !dueDate) {
            req.error(400, 'Borrowing transaction must have borrow date and due date');
        } 
        // Get the specific book copy
        const copy = await SELECT.one.from(BookCopies).where({ ID: bookCopy_ID });
        if (!copy) {
            req.error(400, 'Invalid book copy ID');
        }
        if (copy.status !== 'AVAILABLE') {
            req.error(400, 'Copy is already borrowed');
        }

        // Get the related book
        const book = await SELECT.one.from(Books).where({ ID: copy.book_ID });
        if (!book) {
            req.error(400, 'Book not found for this copy');
        }

        // Count how many copies of this book are currently borrowed
        const borrowedCount = await SELECT.one
            .from(BookCopies)
            .columns('count(*) as count')
            .where({ book_ID: book.ID, status: 'BORROWED' });

        // Count total copies of this book
        const totalCopies = await SELECT.one
            .from(BookCopies)
            .columns('count(*) as count')
            .where({ book_ID: book.ID });

        console.log(totalCopies);
        console.log(borrowedCount);


        // If all copies are borrowed, throw an error
        if (borrowedCount.count >= totalCopies.count) {
            req.error(400, `A book cannot be borrowed if no copies are available for "${book.title}"`);
        }


        // Otherwise, proceed and reduce availableCopies by 1
        if (book.availableCopies <= 0) {
            req.error(400, `No copies available for book "${book.title}"`);
        }

        await UPDATE(Books)
            .set({ availableCopies: book.availableCopies - 1 })
            .where({ ID: book.ID });
        await UPDATE(BookCopies)
            .set({ status: 'BORROWED' })
            .where({ ID: bookCopy_ID });
    });




    // Validate Return - Update available copies when book is returned 
    this.before('UPDATE', 'BorrowingInfo', async (req) => {
        const { status, returnDate } = req.data;

        if (status === 'RETURNED') {
            if (!returnDate) {
                req.error(400, 'Return date must be recorded when book is returned');
            }

            const borrowing = await SELECT.one.from(BorrowingInfo).where({ ID: req.data.ID });
            if (!borrowing) {
                req.error(400, 'Borrowing record not found');
            }

            const copy = await SELECT.one.from(BookCopies).where({ ID: borrowing.bookCopy_ID });
            const book = await SELECT.one.from(Books).where({ ID: copy.book_ID });

            const newAvailable = book.availableCopies + 1;
            if (newAvailable > book.totalCopies) {
                req.error(400, `Available copies cannot exceed total copies (${book.totalCopies})`);
            }
            await UPDATE(Books).set({ availableCopies: newAvailable }).where({ ID: book.ID });
            await UPDATE(BookCopies).set({ status: 'AVAILABLE' }).where({ ID: copy.ID })
        }
    })

    // Validate Book Updates - Ensure availableCopies rules
    this.before('UPDATE', 'Books', async (req) => {
        const { availableCopies, totalCopies } = req.data;
        if (availableCopies < 0) {
            req.error(400, 'Available copies cannot be negative');
        }
        if (totalCopies !== undefined && availableCopies > totalCopies) {
            req.error(400, 'Available copies cannot exceed total copies');
        }
    });


});
