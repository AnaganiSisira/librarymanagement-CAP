const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
    const { Books, BookCopies, BorrowingInfo, Members } = cds.entities;

    // Borrow Book
    this.on('borrowBook', async (req) => {
        const tx = cds.tx(req);
        try {
            const { memberID, bookCopyID, borrowDate, dueDate } = req.data;

            const member = await tx.run(SELECT.one.from(Members).where({ ID: memberID }));
            if (!member) return req.error(400, 'Invalid member ID');
            if (!member.isActive) return req.error(400, 'Member is inactive');

            const borrowedCount = await tx.run(
                SELECT.one.from(BorrowingInfo)
                    .columns('count(*) as count')
                    .where({ member_ID: memberID, status: 'BORROWED' })
            );
            if (borrowedCount.count >= 5)
                return req.error(400, 'Borrowing limit reached (max 5 books)');

            const copy = await tx.run(SELECT.one.from(BookCopies).where({ ID: bookCopyID }));
            if (!copy) return req.error(400, 'Invalid book copy ID');
            if (copy.status !== 'AVAILABLE') return req.error(400, 'This copy is not available');

            const book = await tx.run(SELECT.one.from(Books).where({ ID: copy.book_ID }));
            if (!book) return req.error(400, 'Book not found');

            await tx.run(
                INSERT.into(BorrowingInfo).entries({
                    member_ID: memberID,
                    bookCopy_ID: bookCopyID,
                    borrowDate,
                    dueDate,
                    status: 'BORROWED',
                    createdBy: 'system'
                })
            );

            await tx.run(UPDATE(BookCopies).set({ status: 'BORROWED' }).where({ ID: bookCopyID }));
            await tx.run(
                UPDATE(Books)
                    .set({ availableCopies: book.availableCopies - 1 })
                    .where({ ID: book.ID })
            );

            await tx.commit();
            return { message: 'Book borrowed successfully' };
        } catch (error) {
            await tx.rollback();
            console.error('Error in borrowBook:', error);
            req.error(500, 'Failed to borrow book');
        }
    });

    // Return Book
    this.on('returnBook', async (req) => {
        const tx = cds.tx(req);
        try {
            const { borrowingID, returnDate } = req.data;

            const borrowing = await tx.run(SELECT.one.from(BorrowingInfo).where({ ID: borrowingID }));
            if (!borrowing) return req.error(400, 'Borrowing record not found');

            const copy = await tx.run(SELECT.one.from(BookCopies).where({ ID: borrowing.bookCopy_ID }));
            if (!copy) return req.error(400, 'Book copy not found');

            const book = await tx.run(SELECT.one.from(Books).where({ ID: copy.book_ID }));

            await tx.run(
                UPDATE(BorrowingInfo)
                    .set({ status: 'RETURNED', returnDate })
                    .where({ ID: borrowingID })
            );

            await tx.run(UPDATE(BookCopies).set({ status: 'AVAILABLE' }).where({ ID: copy.ID }));
            await tx.run(
                UPDATE(Books)
                    .set({ availableCopies: book.availableCopies + 1 })
                    .where({ ID: book.ID })
            );

            await tx.commit();
            return { message: 'Book returned successfully' };
        } catch (error) {
            await tx.rollback();
            console.error('Error in returnBook:', error);
            req.error(500, 'Failed to return book');
        }
    });

    // Get Available Books
    this.on('getAvailableBooks', async (req) => {
        try {
            return await SELECT.from(Books).where`availableCopies > 0`;
        } catch (error) {
            console.error('Error in getAvailableBooks:', error);
            req.error(500, 'Failed to fetch available books');
        }
    });

    // Get Overdue Books
    this.on('getOverdueBooks', async (req) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            return await SELECT.from(BorrowingInfo).where`dueDate < ${today} and status = 'BORROWED'`;
        } catch (error) {
            console.error('Error in getOverdueBooks:', error);
            req.error(500, 'Failed to fetch overdue books');
        }
    });

    // Get Member Borrowing History
    this.on('getMemberBorrowingHistory', async (req) => {
        try {
            const { memberID } = req.data;
            return await SELECT.from(BorrowingInfo).where({ member_ID: memberID });
        } catch (error) {
            console.error('Error in getMemberBorrowingHistory:', error);
            req.error(500, 'Failed to fetch member borrowing history');
        }
    });
});
